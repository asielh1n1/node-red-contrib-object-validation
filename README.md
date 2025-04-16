Node-RED node for validating JavaScript objects using the Validate.js library.

It allows the validation of JavaScript objects using a more user-friendly interface, without the need to write complex constraints in JSON format.

### Inputs

: payload (object) :  the payload of the message to publish.


### Outputs

1. Standard output
: payload (object) : the standard output of the operation.

2. Standard error
: payload (string) : the standard error of the operation.

### Details

To validate the same property of an object but with different constraints, you must add each constraint to the list of constraints each time you want to validate that property.
You should note that for constraints like 'Equal to property', 'Regular Expression', 'Maximum Length', 'Minimum Length', 'Date', 'IP v4', 'IP v6', 'URL', the property values must strictly be of type 'string'. 
For the constraints 'In', 'Not In', the values are an array ([ ]).

### Examples

Review the node examples for more clarity on how to use it. You can import it in the import menu and search for the node example "node-red-contrib-object-validation" or the json for the site [GitHub](https://github.com/asielh1n1/node-red-contrib-object-validation/blob/main/examples/example.json).

### References

 - [AJV](https://ajv.js.org/guide/getting-started.html)