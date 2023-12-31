"use strict";

const loadingEl = document.createElement("div");
loadingEl.textContent = "Loading...";
const mainHolder = document.getElementById("main-holder");
mainHolder.appendChild(loadingEl);

axios({
    method: "GET",
    url: "/api/current-user",
})
    .then((response) => {
        const { username, picture, email } = response.data;

        if (username) {
            mainHolder.removeChild(loadingEl);
            mainHolder.insertAdjacentHTML(
                "afterbegin",
                `<div>
                    <img width="100px" height="100px" src="${picture}"/>
                    <h2>${username}</h2>
                    <p>${email}</p>
                </div>`
            );
        }
    })
    .catch(async (err) => {
        console.log(err);
    });
