use pointercrate_core::localization::tr;
use pointercrate_core::ratelimits;
use std::net::IpAddr;

ratelimits! {
    UserRatelimits {
        registrations[30u32 per 3600 per IpAddr] => tr("error-user-ratelimit-registration"),
        soft_registrations[60u32 per 3600 per IpAddr] => tr("error-user-ratelimit-soft-registration"),
        login_attempts[60u32 per 300 per IpAddr] => tr("error-user-ratelimit-login"),

        browser_registrations[1u32 per 86400 per String] => tr("error-user-ratelimit-registration"),
        browser_soft_registrations[5u32 per 21600 per String] => tr("error-user-ratelimit-soft-registration"),
        browser_login_attempts[3u32 per 1800 per String] => tr("error-user-ratelimit-login"),
    }
}
pub fn browser_id(
    cookies: &rocket::http::CookieJar<'_>,
) -> Result<String, pointercrate_core::error::CoreError> {
    use pointercrate_core::util::csprng_u64;
    use rocket::http::{Cookie, SameSite};

    if let Some(cookie) = cookies.get_private("browser_id") {
        return Ok(cookie.value().to_owned());
    }

    let id = format!(
        "{:016x}{:016x}",
        csprng_u64()?,
        csprng_u64()?
    );

    cookies.add_private(
        Cookie::build(("browser_id", id.clone()))
            .path("/")
            .http_only(true)
            .same_site(SameSite::Lax)
            .permanent()
            .build(),
    );

    Ok(id)
}