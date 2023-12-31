import express from "express";
import bodyParser from "body-parser";
import openidConnect from "express-openid-connect";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_PORT = process.env.APP_PORT;
const DOMAIN = process.env.DOMAIN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const app = express();

const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: `http://localhost:${APP_PORT}`,
    clientID: CLIENT_ID,
    issuerBaseURL: `https://${DOMAIN}`,
    secret: CLIENT_SECRET,
};

app.use(openidConnect.auth(config));

app.get("/", openidConnect.requiresAuth(), (_, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.use(express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/current-user", openidConnect.requiresAuth(), async (req, res) => {
    const { user } = req.oidc;
    console.log(user);

    return res.json({
        username: user.name,
        picture: user.picture,
        email: user.email,
        logout: `http://localhost:${APP_PORT}/logout`,
    });
});

app.listen(APP_PORT, () => {
    console.log(`App listening on http://localhost:${APP_PORT}`);
});
