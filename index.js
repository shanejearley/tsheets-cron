import util from "util";
import request from "request";
const requestPromise = util.promisify(request);
import { getCurrentDateString, getCurrentDateStringShort } from "./utils/date.js";

const dateString = getCurrentDateString();
const dateStringShort = getCurrentDateStringShort(dateString);

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
let accessToken = process.env.ACCESS_TOKEN;
let refreshToken = process.env.REFRESH_TOKEN;

const main = async () => {

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
    let user = users[userKeys[0]];

    if (
    user.error === "invalid_grant" &&
    user.error_description === "The access token provided has expired"
    ) {
    const refreshOptions = {
        method: "POST",
        url: "https://rest.tsheets.com/api/v1/grant",
        headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        },
        form: {
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        },
    };

    const { body: grantBody } = await requestPromise(refreshOptions);

    ({ accessToken, refreshToken } = JSON.parse(grantBody));

    userOptions.headers.Authorization = `Bearer ${accessToken}`(
        ({ body: userBody } = await requestPromise(userOptions))
    )((userData = JSON.parse(userBody)))(({ users } = userData.results))(
        (userKeys = Object.keys(users))
    )((user = users[userKeys[0]]));
    }

    const timesheetOptions = {
    method: "GET",
    url: "https://rest.tsheets.com/api/v1/timesheets",
    qs: {
        user_ids: user.id,
        start_date: dateStringShort,
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
    const status = timesheets[timesheetKeys[timesheetKeys.length - 1]];

    if (!status || !status.on_the_clock) {
    console.log("No active timesheet found");
    return { statusCode: 200 };
    }

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
            end: dateString,
            jobcode_id: status.jobcode_id,
        },
        ],
    }),
    };

    await requestPromise(clockOutOptions);
    console.log("Clocked out");
    return { statusCode: 200 };
};

main().catch(err => console.log(JSON.stringify(err)));
