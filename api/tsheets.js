const util = require("util");
const request = require("request");
const requestPromise = util.promisify(request);

const {
    getCurrentDateString,
    getCurrentDateStringShort,
  } = require("../utils/date.js");

const DATE_STRING = getCurrentDateString();
const DATE_STRING_SHORT = getCurrentDateStringShort(DATE_STRING);

class TSheetsClass {
  async getUser(accessToken) {
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
  }

  async getAccessToken(accessToken, refreshToken) {
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
  }

  async getStatus(accessToken, user) {
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
  }

  async clockOut(accessToken, status) {
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
}

exports.TSheets = new TSheetsClass();
