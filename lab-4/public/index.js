"use strict";

const SESSION_KEY = "session";

const session = sessionStorage.getItem(SESSION_KEY);

let token;

try {
    token = JSON.parse(session)?.token;

    if (!token) {
        location.replace("/login");
    }
} catch (e) {
    sessionStorage.removeItem(SESSION_KEY);
    location.replace("/login");
}

const loadingEl = document.createElement("div");
loadingEl.textContent = "Loading...";

function getTokenTimeLeft(token) {
    const [, tokenPayloadBase64] = token.split(".");
    const decodedJsonPayload = atob(tokenPayloadBase64);
    const tokenPayload = JSON.parse(decodedJsonPayload);
    const tokenTimeLeftHr =
        (tokenPayload.exp * 1000 - Date.now()) / (1000 * 60 * 60);

    return tokenTimeLeftHr;
}

if (token) {
    const mainHolder = document.getElementById("main-holder");
    mainHolder.appendChild(loadingEl);

    const tokenTimeLeftHr = getTokenTimeLeft(token);

    axios({
        method: "GET",
        url: "/api/current-user",
        headers: {
            Authorization: token,
        },
    })
        .then((response) => {
            const { username } = response.data;

            if (username) {
                mainHolder.removeChild(loadingEl);
                mainHolder.append(`Hello ${username}`);
                mainHolder.append(document.createElement("br"));
                const timeLeftElement = document.createElement("div");
                timeLeftElement.innerText = `your JWT-token expires in: ${tokenTimeLeftHr.toFixed(
                    1
                )} hours`;
                mainHolder.append(timeLeftElement);
                logoutLink.style.opacity = 1;
            }
        })
        .catch(async (err) => {
            if (err.response?.status === 401) {
                try {
                    const refreshToken = JSON.parse(session)?.refreshToken;
                    if (!refreshToken) {
                        return resolve(false);
                    }

                    const { data: tokens } = await axios({
                        method: "POST",
                        url: "/api/refresh",
                        data: {
                            refreshToken,
                        },
                    });

                    await new Promise((resolve) => setTimeout(resolve, 10000));

                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(tokens));
                    location.reload();
                } catch (err) {
                    sessionStorage.removeItem(SESSION_KEY);
                    location.replace("/login");
                }
            }
        });
}

const logoutLink = document.getElementById("logout");

logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
});
