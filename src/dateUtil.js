const DAY_IN_MS = 24 * 60 * 60 * 1000;

module.exports = {

  getFromDate: (since) => {
    return getISODate(since)
  },

  convertDaysToDate: (days) => {
    if (days > 0) {
      const offset = DAY_IN_MS * days;
      console.log(offset)
      value = Date.now() - offset ;
      return getISODate(value);
    } else {
      throw new Error(`Invalid number of days; ${days}, must be greater than zero`);
    }
  }
}

function getISODate(value) {
  console.log(value)
  if (!value) {
    throw new Error(`A date value must be provided and you provided -- ${value}`);
  }

  const date = new Date(value);
  clearTime(date);
  return date.toISOString();
}

function clearTime(date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
}