"use strict";

import {
  del,
  post,
  displayError,
  patch,
  valueMissing,
  FilteredPaginator,
  Form,
  Viewer,
} from "/static/core/js/modules/form.js";
import { loadResource, tr, trp } from "/static/core/js/modules/localization.js";

let selectedUser;
let userPaginator;
let editForm;

function setupPatchUserPermissionsForm() {
  editForm = new Form(document.getElementById("patch-permissions"));
  editForm.onSubmit(function () {
    patch(
      "/api/v1/users/" + selectedUser.id + "/",
      {
        "If-Match": selectedUser.etag,
      },
      {
        permissions: editForm.inputs
          .map((input) => input.value * parseInt(input.span.dataset.bit))
          .reduce((a, b) => a + b, 0),
      }
    )
      .then((response) => {
        if (response.status == 200) {
          selectedUser = response.data.data;
          selectedUser.etag = response.headers["etag"];

          editForm.setSuccess(tr("user", "user", "user-viewer.edit-success"));
        } else {
          editForm.setSuccess(
            tr("user", "user", "user-viewer.edit-notmodified")
          );
        }
        })
        .catch(displayError(editForm));
    });

  const resetPasswordButton = document.getElementById("reset-user-password");

  if (resetPasswordButton) {
    resetPasswordButton.addEventListener("click", async () => {
      if (!selectedUser || selectedUser.name === window.username) {
        return;
      }

      if (!confirm(`Reset the password for ${selectedUser.name}?`)) {
        return;
      }

      resetPasswordButton.disabled = true;

      try {
        const response = await post(
          "/api/v1/users/" + selectedUser.id + "/reset-password",
          {}
        );

        const password = response.data;

        // Keep the temporary password visible until the admin dismisses it.
        const passwordWindow = window.open("", "_blank", "width=500,height=300");

if (passwordWindow) {
  const heading = passwordWindow.document.createElement("h2");
  heading.textContent = "Temporary Password";

  const description = passwordWindow.document.createElement("p");
  description.textContent =
    `Account: ${selectedUser.name}. Copy this password now. It cannot be retrieved later.`;

  const passwordField = passwordWindow.document.createElement("input");
  passwordField.type = "text";
  passwordField.readOnly = true;
  passwordField.value = password;
  passwordField.style.width = "95%";

  const copyButton = passwordWindow.document.createElement("button");
  copyButton.textContent = "Copy Password";
  copyButton.addEventListener("click", async () => {
    passwordField.select();
    passwordWindow.document.execCommand("copy");
    copyButton.textContent = "Copied!";
  });

  passwordWindow.document.body.append(
    heading,
    description,
    passwordField,
    copyButton
  );
} else {
  prompt("Copy the temporary password now:", password);
}
      } catch (error) {
        displayError(editForm)(error);
      } finally {
        resetPasswordButton.disabled = false;
      }
      });
    }

    let deleteUserButton = document.getElementById("delete-user");

  if (deleteUserButton) {
    // The button isn't generated server sided for people who don't have permissions to delete users (aka aren't pointercrate admins)
    deleteUserButton.addEventListener("click", () => {
      del("/api/v1/users/" + selectedUser.id + "/", {
        "If-Match": selectedUser.etag,
      })
        .then(() =>
          editForm.setSuccess(tr("user", "user", "user-viewer.delete-success"))
        )
        .catch(displayError(editForm));
    });
  }
}

function setupUserByIdForm() {
  var userByIdForm = new Form(document.getElementById("find-id-form"));
  var userId = userByIdForm.input("find-id");

  userId.addValidator(
    valueMissing,
    tr("user", "user", "user-idsearch-panel.id-validator-valuemissing")
  );

  userByIdForm.onSubmit(function () {
    userPaginator.selectArbitrary(userId.value).catch((response) => {
      if (response.data.code == 40401) {
        userId.errorText = response.data.message;
      } else {
        userByIdForm.setError(response.data.message);
      }
    });
  });
}

function generateUser(userData) {
  var li = document.createElement("li");
  var b = document.createElement("b");
  var i = document.createElement("i");

  li.dataset.id = userData.id;

  b.appendChild(document.createTextNode(userData.name));
  i.appendChild(
    document.createTextNode(
      tr("user", "user", "user-listed.displayname") +
        " " +
        (userData.display_name || tr("user", "user", "user-displayname.none"))
    )
  );

  li.appendChild(b);
  li.appendChild(
    document.createTextNode(
      " (" +
        trp("user", "user", "user-listed", {
          ["user-id"]: userData.id,
        }) +
        ")"
    )
  );
  li.appendChild(document.createElement("br"));
  li.appendChild(i);

  return li;
}

class UserPaginator extends FilteredPaginator {
  constructor() {
    super("user-pagination", generateUser, "name_contains", { limit: 10 });

    this.output = new Viewer(
      this.html.parentNode.getElementsByClassName("viewer-content")[0],
      this
    );
  }

  onReceive(response) {
    super.onReceive(response);

    selectedUser = response.data.data;
    selectedUser.etag = response.headers["etag"];

    editForm.setError(null);

    if (selectedUser.name == window.username) {
      editForm.setError(tr("user", "user", "user-viewer.own-account"));
      for (let btn of this.output.html.getElementsByTagName("input")) {
        btn.classList.add("disabled");
        btn.disabled = true;
      }
    } else {
      for (let btn of this.output.html.getElementsByTagName("input")) {
        btn.classList.remove("disabled");
        btn.disabled = false;
      }
    }

    document.getElementById("user-user-name").innerText = selectedUser.name;
    document.getElementById("user-user-id").innerText = selectedUser.id;
    document.getElementById("user-display-name").innerText =
      selectedUser.display_name || tr("user", "user", "user-displayname.none");

    let bitmask = selectedUser.permissions;

    for (let input of editForm.inputs) {
      let bit = parseInt(input.span.dataset.bit);

      input.value = (bitmask & bit) === bit;
    }

    editForm.html.style.display = "block";
  }
}

export function initialize() {
  setupPatchUserPermissionsForm();
  setupUserByIdForm();

  userPaginator = new UserPaginator();
  userPaginator.initialize();
}
