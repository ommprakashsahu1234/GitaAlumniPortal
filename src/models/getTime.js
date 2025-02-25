const getTime = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1; // Months are zero-based (0 = January)
    const year = now.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
  
    let hours = now.getHours();
    let mins = now.getMinutes();
    let a; // Declare the period (AM/PM)
  
    if (hours > 12) {
      hours = hours - 12;
      a = "PM";
      if (hours < 10) {
        hours = "0" + hours;
      }
    } else if (hours === 0) {
      hours = 12;
      a = "AM";
    } else {
      a = "AM";
    }
  
    if (mins < 10) {
      mins = "0" + mins;
    }
  
    // Return the values in an object
    return { day, month, year, dateStr, hours, mins, a };
  };

  module.exports = getTime;
  