exports.getCurrentDateString = () => {
	const datetime = getCurrentDateTime();
    const timezone = getCurrentTimezone();
    return datetime + timezone;
}

exports.getCurrentDateStringShort = (dateString) => {
    return dateString.split('T')[0];
}

const getCurrentDateTime = () => {
    const date = new Date(Date.now());
	let day = date.getDate();
	let month = date.getMonth() + 1;
	let year = date.getFullYear();
	let hours = date.getHours();
	let minutes = date.getMinutes();
	let seconds = date.getSeconds();

    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds;
}

const getCurrentTimezone = () => {
    const timezoneOffset = new Date().getTimezoneOffset();
	let offsetHours = parseInt(Math.abs(timezoneOffset/60));
	let offsetMinutes = Math.abs(timezoneOffset%60);

    if (offsetHours < 10)
        offsetHours = '0' + offsetHours;

    if (offsetMinutes < 10)
        offsetMinutes = '0' + offsetMinutes;

    if (timezoneOffset < 0)
        return '+' + offsetHours + ':' + offsetMinutes;
    else if (timezoneOffset > 0)
        return '-' + offsetHours + ':' + offsetMinutes;
    else
        return 'Z';
}