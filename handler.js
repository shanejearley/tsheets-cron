import util from "util";
import request from "request";
const requestPromise = util.promisify(request);
import {
  getCurrentDateString,
  getCurrentDateStringShort,
} from "./utils/date.js";

const DATE_STRING = getCurrentDateString();
const DATE_STRING_SHORT = getCurrentDateStringShort(DATE_STRING);
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export const run = async (_event, _context) => {
  let accessToken = process.env.ACCESS_TOKEN;
  let refreshToken = process.env.REFRESH_TOKEN;

  let user = await getUser(accessToken);

  if (
    user.error === "invalid_grant" &&
    user.error_description === "The access token provided has expired"
  ) {
    ({ accessToken, refreshToken } = await getAccessToken(
      accessToken,
      refreshToken
    ));

    user = await getUser(accessToken);
  }

  const status = await getStatus(accessToken, user);

  if (!status || !status.on_the_clock) {
    console.log("No active timesheet found");
    return { statusCode: 200 };
  }

  await clockOut(accessToken, status);
  console.log("Clocked out");
  return { statusCode: 200 };
};

const getUser = async (accessToken) => {
  const userOptions = {
    method: "GET",
    url: "https://rest.tsheets.com/api/v1/current_user",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  let { body: userBody } = await requestPromise(userOptions);
  let userData = JSON.parse(userBody);
  let { users } = userData.results;
  let userKeys = Object.keys(users);
  return users[userKeys[0]];
};

const getAccessToken = async (accessToken, refreshToken) => {
  const refreshOptions = {
    method: "POST",
    url: "https://rest.tsheets.com/api/v1/grant",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    form: {
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    },
  };

  const { body: grantBody } = await requestPromise(refreshOptions);

  return JSON.parse(grantBody);
};

const getStatus = async (accessToken, user) => {
  const timesheetOptions = {
    method: "GET",
    url: "https://rest.tsheets.com/api/v1/timesheets",
    qs: {
      user_ids: user.id,
      start_date: DATE_STRING_SHORT,
      on_the_clock: "both",
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  const { body: timesheetBody } = await requestPromise(timesheetOptions);
  const timesheetData = JSON.parse(timesheetBody);
  const { timesheets } = timesheetData.results;
  const timesheetKeys = Object.keys(timesheets);
  return timesheets[timesheetKeys[timesheetKeys.length - 1]];
};

const clockOut = async (accessToken, status) => {
  const clockOutOptions = {
    method: "PUT",
    url: "https://rest.tsheets.com/api/v1/timesheets",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [
        {
          id: parseInt(status.id),
          end: DATE_STRING,
          jobcode_id: status.jobcode_id,
        },
      ],
    }),
  };

  return await requestPromise(clockOutOptions);
}

run().catch(err => console.error(err));
