import jwt from "jsonwebtoken";
import jwks from "jwks-rsa";
import { management } from "./auth0-clients.js";
import { HTTP_CODE } from "./constants.js";

const SESSION_KEY = "Authorization";

const DOMAIN = process.env.DOMAIN;

const verifyToken = async (bearerToken) => {
    const jwksClient = jwks({
        jwksUri: `https://${DOMAIN}/.well-known/jwks.json`,
    });

    const getJwksClientKey = (header, callback) => {
        jwksClient.getSigningKey(header.kid, (_, key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    };

    return new Promise((resolve, reject) => {
        jwt.verify(
            bearerToken,
            getJwksClientKey,
            {
                audience: process.env.AUDIENCE,
                issuer: `https://${DOMAIN}/`,
                algorithms: ["RS256"],
            },
            (err, decoded) => (err ? reject(err) : resolve(decoded))
        );
    });
};

const authMiddleware = async (req, res, next) => {
    const authToken = req.get(SESSION_KEY)?.split(" ").pop();

    if (!authToken) {
        return next();
    }

    try {
        const result = await verifyToken(authToken);
        const { sub: userId } = result ? result : {};

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

export { authMiddleware };
