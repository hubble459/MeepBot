# MeepBot
Bot for meeping

## Commands
| music    |          | misc    | settings |
| ---      | ---      | ---     | ---      |
| play     | clear    | alias   | prefix   |
| stop     | remove   | aliasrm | space    |
| skip     | repeat   | aliases |          |
| pause    | shuffle  | echo    |          |
| resume   | playlist | meep    |          |
| queue    | volume   | ping    |          |
| now      |          |         |          |


## Install
Create a file with the name `config.js` in de `src/utils/` folder.  
The file should look like this:
```javascript
module.exports = {
  token: 'my discord bot token here'
};
```

After making this file, you can install the dependencies and run the program with the following:
```shell
npm install
npm start
```

## Dependencies
See [package.json](./package.json) to see all dependencies.
