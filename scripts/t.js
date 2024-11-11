const options = {    
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: 'numeric', hour12: false,
    minute: "numeric",
    second: "numeric"
  };
const runStart = new Date().toLocaleDateString('en-ca', options);
console.log(runStart);