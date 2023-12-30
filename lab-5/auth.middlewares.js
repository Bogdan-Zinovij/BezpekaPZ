import { management } from "./auth0-clients.js";
import { HTTP_CODE } from "./constants.js";
import { auth as jwtValidator } from "express-oauth2-jwt-bearer";

const DOMAIN = process.env.DOMAIN;
const AUDIENCE = process.env.AUDIENCE;

const auth0JwtValidator = jwtValidator({
    issuerBaseURL: `https://${DOMAIN}`,
    audience: AUDIENCE,
});

const userMiddleware = async (req, res, next) => {
    console.log(req.auth);

    try {
        const { sub: userId } = req.auth ? req.auth.payload : {};

        if (!userId) {
            return res.status(HTTP_CODE.Unauthorized).send();
        }

        const { data: user } = await management.users.get({ id: userId });

        if (!user) {
            return res.status(HTTP_CODE.Unauthorized).send();
        }

        req.user = user;
    } catch (err) {
        return res.status(HTTP_CODE.Unauthorized).send();
    }

    return next();
};

export { auth0JwtValidator, userMiddleware };
