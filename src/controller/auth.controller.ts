import {Request, Response} from "express";
import {validate} from "class-validator";

import {User} from "../entity/user";
import * as HttpStatus from 'http-status';

class AuthController {

  static login = async (req: Request, res: Response) => {
    try {
      //Check if email and password are set
      let { email, password, username } = req.body;
      if (!((email || username) && password)) {
        res.status(HttpStatus.UNAUTHORIZED).send();
      }

      //Get user from database
      let user: User = null as any;
      var code = null as any;
      if (email) {
        try {
          const userAction = async () => {
            const response = await fetch('http://localhost:8081/api/db/get/user/email/' + email);
            const myJson = await response.json(); //extract JSON from the http response
            // do something with myJson
            code = response.status;
            user = myJson;
          }
        } catch (error) {
          res.status(HttpStatus.UNAUTHORIZED).send( {"status": "Email is incorrect"} );
        }
      } else if (username) {
        try {
          const userAction = async () => {
            const response = await fetch('http://localhost:8081/api/db/get/user/username/' + username);
            const myJson = await response.json(); //extract JSON from the http response
            // do something with myJson
            code = response.status;
            user = myJson;
          }
        } catch (error) {
          res.status(HttpStatus.UNAUTHORIZED).send( {"status": "Username is incorrect"} );
        }
      }

      res.status(HttpStatus.OK).send({status: "User " + user.username + " logged in!"});
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  };

  static changePassword = async (req: Request, res: Response) => {
    try {
    //Get parameters from the body
    const { email, oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      res.status(HttpStatus.BAD_REQUEST).send();
    }

    //Get user from the database
    let user: User;
    let code;
    try {
      const userAction = async () => {
        const response = await fetch('http://localhost:8081/api/db/get/user/email/' + email);
        const myJson = await response.json(); //extract JSON from the http response
        // do something with myJson
        user = User.from(myJson);
        code = response.status;
      }
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
    if (code != HttpStatus.OK) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }

    //Validate de model (password lenght)
    user!.password = newPassword;
    const errors = await validate(user!);
    if (errors.length > 0) {
      res.status(HttpStatus.BAD_REQUEST).send(errors);
      return;
    }
    //Hash the new password and save
    user!.hashPassword();
    
    const userAction = async () => {
      const response = await fetch('http://localhost:8081/api/db/update/user', {
        method: 'POST',
        body: JSON.stringify(user), // string or object
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const myJson = await response.json(); //extract JSON from the http response
      // do something with myJson
      code = response.status;
    }
    if (code != HttpStatus.OK) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }

    let response = {success: "Password changed successfully!"}
    res.status(HttpStatus.OK).send(response);
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  };

  static register = async (req: Request, res: Response) => {
    let response = null as any;
    try {
      let user = User.from(req.body);
      user.role = "user";
      user.imageString = "";
      user.firstName = "";
      user.lastName = "";
      user.birthDate = new Date();
      user.profilePic = "";
      user.hashPassword();
      console.log(JSON.stringify(user));
      let code;
      const userAction = async () => {
        const response = await fetch('http://localhost:8081/api/db/create/user', {
          method: 'POST',
          body: JSON.stringify(user), // string or object
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        });
        const myJson = await response.json(); //extract JSON from the http response
        // do something with myJson
        code = response.status;
      }
      // fetch('http://localhost:8081/api/db/create/user', {
      //   method: 'POST',
      //   body: JSON.stringify(user),
      //   headers: {
      //     'Content-type': 'application/json',
      //   }
      //   })
      //   .then(function(response) { 
      //     code = response.status;
      //     return response.json()
      //   }).then(function(data) {
      //       console.log(data)
      //   }).catch(error => console.error('Error:', error));
      console.log(code);
      if (code != HttpStatus.OK) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
      }
      response = {success: "User created!"}
      res.status(HttpStatus.CREATED).send(response);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }

}

export default AuthController;
