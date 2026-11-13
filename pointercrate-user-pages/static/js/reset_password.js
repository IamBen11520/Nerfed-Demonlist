
import { post, patch } from "/static/core/js/modules/form.js";

const form = document.getElementById("reset-password-form");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("reset-username").value;
  const temporaryPassword = document.getElementById("temporary-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const error = document.getElementById("reset-password-error");
  const submitButton = form.querySelector('[type="submit"]');

  error.textContent = "";

  if (newPassword !== confirmPassword) {
    error.textContent = "The new passwords do not match.";
    return;
  }

  if (newPassword.length < 10) {
    error.textContent = "Your new password must contain at least 10 characters.";
    return;
  }

  if (newPassword === temporaryPassword) {
    error.textContent = "Choose a different password.";
    return;
  }

  submitButton.disabled = true;

  try {
    const authorization =
      "Basic " + btoa(username + ":" + temporaryPassword);

    const loginResponse = await post(
      "/api/v1/auth/",
      { Authorization: authorization }
    );

    const etag = Object.entries(loginResponse.headers).find(
  ([name]) => name.toLowerCase() === "etag"
)?.[1];

    if (!etag) {
      throw new Error("Could not retrieve account version.");
    }

    await patch(
      "/api/v1/auth/me/",
      {
        Authorization: authorization,
        "If-Match": etag,
      },
      { password: newPassword }
    );

    // The password change invalidates the old login session.
    window.location.replace("/login/");
  } catch (response) {
    error.textContent =
      response?.data?.message ||
      response?.message ||
      "Password change failed. Check your credentials and try again.";
  } finally {
    submitButton.disabled = false;
  }
});
