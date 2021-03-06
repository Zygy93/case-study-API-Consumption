// Dependencies
const fetch = require('node-fetch')
const Moment = require('moment')
const inquirer = require("inquirer");

inquirer
  //Prompts the user in the Command Line for input.
  .prompt([{
    type: "input",
    name: "busRoute",
    message: "Enter bus route number."
  },
  {
    type: "input",
    name: "busStopName",
    message: "Enter your stop ID on route."
  }, 
  {
    type: "input",
    name: "direction",
    message: "Enter your direction."
  }
    ]).then(function(response){
      try {
        if (Object.keys(response).length > 3 || !response.busRoute || !response.busStopName || !response.direction) {
          throw new Error('Please enter 3 required parameters: (1) Bus Route, (2) Bus Stop Name, and (3) Direction')
        } else {
          checkBusRoute()
        }// End of function
        
        // Checks if the route is available, verifies the description, and then checks for the direction
        function checkBusRoute () {
          fetch(`https://svc.metrotransit.org/NexTrip/Routes?format=json`)
            .then(response => response.json())
            .then(findBusRoute)
            .catch(error => requestError(error, 'Bus Route Request Error'))
            .then(checkDirection)
        }// End of function
    
        // Finds the bus route description
        function findBusRoute (data) {
          busRoute = data.find(function (item) {
            return item.Description === response.busRoute
          })
          if (busRoute) {
            verifiedRoute = busRoute.Route
          } else {
            throw new Error('Route not found. Please try again.')
          }
        }// End of function
    
        // Checks for the direction, verifies the direction, and then checks for the bus stop name
        function checkDirection () {
          if (verifiedRoute) {
            direction = response.direction.toUpperCase()
            fetch('https://svc.metrotransit.org/NexTrip/Directions/' + verifiedRoute + '?format=json')
            .then(response => response.json())
            .then(findBusDirection)
            .catch(error => requestError(error, 'Direction Request Error'))
            .then(checkBusStopName)
          }
        }// End of function
    
        // Finds the bus route direction
        function findBusDirection (data) {
          for (var dir in data) {
            if (data[dir].Text.includes(direction)) {
              verifiedDirection = data[dir].Value
            }
          }
          if (!verifiedDirection) {
            throw new Error('Direction not found. Please try again.')
          }
        }// End of function
    
        // Checks for the bus stop name, verifies the bus stop name, and then gets the departure times
        function checkBusStopName () {
          if (verifiedRoute && verifiedDirection) {
            fetch('https://svc.metrotransit.org/NexTrip/Stops/' + verifiedRoute + '/' + verifiedDirection + '?format=json')
            .then(response => response.json())
            .then(findBusStopName)
            .catch(error => requestError(error, 'Bus Stop Name Request Error'))
            .then(getDepartureTimes)
          }
        }// End of function
        
        // Finds the bus stop name
        function findBusStopName (data) {
          for (var busStopName in data) {
            if (data[busStopName].Text.includes(busStopName)) {
              verifiedBusStop = data[busStopName].Value
            }
          }
          if (!verifiedBusStop) {
            throw new Error('Bus stop not found. Please try again.')
          }
        }// End of function
    
        // if we have the Route, Direction, and Bus Stop, we will find the departure time.
        function getDepartureTimes () {
          if (verifiedRoute && verifiedDirection && verifiedBusStop) {
            fetch('https://svc.metrotransit.org/NexTrip/' + verifiedRoute + '/' + verifiedDirection + '/' + verifiedBusStop + '?format=json')
            .then(response => response.json())
            .then(findDepartureTimes)
            .catch(error => requestError(error, 'departure times'))
          }
        }// End of function
        
        // Checks for departure times, verifies the departure times, and then console logs the next departure time
        function findDepartureTimes (data) {
          if (data[0]) {
            if (data[0].Actual) {
              console.log(data[0].DepartureText.replace('Min', 'minutes'))
            } else {
              Moment.relativeTimeThreshold('m', 60)
              var duration = new Moment(data[0].DepartureTime).fromNow()
              console.log(duration.substring(3, duration.length))
            }
          } else {
            throw new Error('The last bus for the day has already left.')
          }
        }// End of function
    
        function requestError (error) {
          console.log(error.message)
        }// End of function
      } catch(error) {
        console.log(error.message)
      }// End of function

    });
