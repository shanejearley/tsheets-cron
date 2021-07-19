const { TSheets } = require("./api/tsheets")

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
let accessToken = process.env.ACCESS_TOKEN;
let refreshToken = process.env.REFRESH_TOKEN;

module.exports.run = async (_event, _context) => {

  if (!checkCreds) {
    console.log("Missing environment variables");
    return { statusCode: 500 };
  }

  let user = await TSheets.getUser(accessToken);

  if (
    user.error === "invalid_grant" &&
    user.error_description === "The access token provided has expired"
  ) {
    ({ accessToken, refreshToken } = await TSheets.getAccessToken(
      accessToken,
      refreshToken
    ));

    user = await TSheets.getUser(accessToken);
  }

  const status = await TSheets.getStatus(accessToken, user);

  if (!status || !status.on_the_clock) {
    console.log("No active timesheet found");
    return { statusCode: 200 };
  }

  await TSheets.clockOut(accessToken, status);
  console.log("Clocked out");
  return { statusCode: 200 };
};

const checkCreds = () => {
  return CLIENT_ID && CLIENT_SECRET && accessToken && refreshToken
}