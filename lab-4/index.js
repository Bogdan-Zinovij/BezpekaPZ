import express from "express";
import bodyParser from "body-parser";
import { authMiddleware } from "./auth.middleware.js";
import { auth } from "./auth0-clients.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { HTTP_CODE } from "./constants.js";

const APP_PORT = process.env.APP_PORT;
const AUDIENCE = process.env.AUDIENCE;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/login", (_, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

app.get("/register", (_, res) => {
    res.sendFile(__dirname + "/public/register.html");
});

app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        await auth.database.signUp({
            password,
            email,
            connection: "Username-Password-Authentication",
        });

        const { data: tokens } = await auth.oauth.passwordGrant({
            password,
            username: email,
            audience: AUDIENCE,
            scope: "offline_access",
        });

        return res.json({
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
        });
    } catch (err) {
        return res.status(HTTP_CODE.BadRequest).send({ message: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: tokens } = await auth.oauth.passwordGrant({
            password,
            username: email,
            audience: AUDIENCE,
            scope: "offline_access",
        });

        return res.json({
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
        });
    } catch {
        return res.status(HTTP_CODE.Unauthorized).send();
    }
});

app.get("/api/current-user", authMiddleware, (req, res) => {
    if (req.user) {
        return res.json({
            username: req.user.name,
            logout: `http://localhost:${APP_PORT}/logout`,
        });
    }

    return res.status(HTTP_CODE.Unauthorized).send();
});

app.post("/api/refresh", async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const { data: tokens } = await auth.oauth.refreshTokenGrant({
            refresh_token: refreshToken,
        });

        return res.json({
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
        });
    } catch (err) {
        return res.status(HTTP_CODE.Unauthorized).send();
    }
});

app.get("/logout", (_, res) => {
    res.redirect("/");
});

app.listen(APP_PORT, () => {
    console.log(`App listening on http://localhost:${APP_PORT}`);
});
