const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const PORT = 3000;
const JWT_SECRET_KEY = "JWT_SECRET_KEY";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = "Authorization";

app.use((req, res, next) => {
    const authToken = req.get(SESSION_KEY);
    if (!authToken) {
        return next();
    }
    try {
        const payload = jwt.verify(authToken, JWT_SECRET_KEY);
        if (!payload.login) {
            return res.status(401).send();
        }

        const user = users.find((user) => user.login === payload.login);
        if (!user) {
            return res.status(401).send();
        }

        const expiresIn = (payload.exp - payload.iat) / 3600;
        user.expiresIn = expiresIn;

        req.user = user;
    } catch {
        return res.status(401).send();
    }
    return next();
});

app.get("/", (req, res) => {
    if (req.user) {
        return res.json({
            username: req.user.username,
            expiresIn: req.user.expiresIn,
            logout: "http://localhost:3000/logout",
        });
    }

    res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/logout", (req, res) => {
    res.redirect("/");
});

const users = [
    {
        login: "Login",
        password: "Password",
        username: "Username",
    },
    {
        login: "Login1",
        password: "Password1",
        username: "Username1",
    },
];

app.post("/api/login", (req, res) => {
    const { login, password } = req.body;
    const user = users.find((user) => {
        if (user.login === login && user.password === password) {
            return true;
        }

        return false;
    });

    if (user) {
        const token = jwt.sign(
            { username: user.username, login: user.login },
            JWT_SECRET_KEY,
            { expiresIn: "24h" }
        );

        return res.json({ token });
    }

    return res.status(401).send();
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
