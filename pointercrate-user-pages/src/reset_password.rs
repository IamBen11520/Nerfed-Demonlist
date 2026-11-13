
use maud::{html, Markup};
use pointercrate_core_pages::{head::HeadLike, PageFragment};

pub fn reset_password_page() -> PageFragment {
    PageFragment::new(
        "Nerfed Demonlist - Change Password",
        "Change your temporary password to continue using your account.",
    )
    .module("/static/user/js/reset_password.js")
    .module("/static/core/js/modules/form.js")
    .stylesheet("/static/user/css/login.css")
    .body(reset_password_body())
}

fn reset_password_body() -> Markup {
    html! {
        div.center style="display: flex; align-items: center; justify-content: center; min-height: calc(100% - 70px);" {
            div.panel.fade {
                h1.underlined.pad { "Change Password" }

                p {
                    "Your password was reset by an administrator. "
                    "You must choose a new password before continuing."
                }

                form.flex.col #reset-password-form novalidate="" {
                    p.info-red.output {}

                    span.form-input {
                        label for="username" { "Username" }
                        input #reset-username type="text" name="username" required="";
                    }

                    span.form-input {
                        label for="temporary-password" { "Temporary Password" }
                        input #temporary-password type="password" name="temporary-password" required="";
                    }

                    span.form-input {
                        label for="new-password" { "New Password" }
                        input #new-password type="password" name="new-password" minlength="10" required="";
                    }

                    span.form-input {
                        label for="confirm-password" { "Confirm New Password" }
                        input #confirm-password type="password" name="confirm-password" minlength="10" required="";
                    }

                    p.error #reset-password-error {}

                    input.button.blue.hover type="submit"
                        style="margin: 15px auto 0px;"
                        value="Change Password";
                }
            }
        }
    }
}
