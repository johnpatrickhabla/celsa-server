const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5000/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value.toLowerCase().trim()
              : null;
          const googleId = profile.id;
          const avatar =
            profile.photos && profile.photos[0]
              ? profile.photos[0].value
              : "";
          const name =
            profile.displayName ||
            `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
            "Google User";

          if (!email) {
            return done(new Error("No email associated with this Google account"), null);
          }

          // Check if user exists by googleId or email
          let user = await User.findOne({
            $or: [{ googleId }, { email }],
          });

          if (user) {
            let updated = false;
            if (!user.googleId) {
              user.googleId = googleId;
              updated = true;
            }
            if (!user.avatar && avatar) {
              user.avatar = avatar;
              updated = true;
            }
            if (updated) {
              await user.save();
            }
            return done(null, user);
          }

          // Create new user if not found
          user = new User({
            name,
            email,
            googleId,
            avatar,
            role: "customer",
          });

          await user.save();
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️ GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google OAuth will require these credentials in .env to function."
  );
}

module.exports = passport;
