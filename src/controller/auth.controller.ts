import {Request, Response} from "express";
import {validate} from "class-validator";
import * as jwt from "jsonwebtoken";
import {User} from "../entity/user";
import * as HttpStatus from 'http-status';

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('config/properties');

const fetch = require("node-fetch");

class AuthController {

  static login = async (req: Request, res: Response) => {
    try {
      console.log(req.body)
      //Check if email and password are set
      let { email, password, username } = req.body;
      if (!((email || username) && password)) {
        res.status(HttpStatus.UNAUTHORIZED).send();

        return;
      }

      //Get user from database
      let user;
      var code = null as any;
      if (email) {
          await fetch(properties.get("user_db_url") + 'get/email/' + email, {
            method: 'GET',
            headers: {
              'Content-type': 'application/json'
            }}).then(response => {
              code = response.status;
              console.log(response)
              return response.json()
          }).then(data => {
              user = User.from(data);
              console.log(data)
          }).catch(error => res.status(HttpStatus.UNAUTHORIZED).send( {"status": "Email is incorrect"} ));
      } else if (username) {
          await fetch(properties.get("user_db_url") + 'get/username/' + username, {
            method: 'GET',
            headers: {
              'Content-type': 'application/json'
            }}).then(response => {
              code = response.status;
              return response.json()
          }).then(data => {
              user = User.from(data);
              console.log(data)
          }).catch(error => res.status(HttpStatus.UNAUTHORIZED).send( {"status": "Username is incorrect"} ));
      }

      console.log(user!.password);
      if (password != user!.password) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({status: "Password is incorrect!"});
      }
      //Sing JWT, valid for 7 days
      const token = jwt.sign(
        { userId: user!.id, username: user!.username, role: user!.role },
        properties.get("jwtSecret"),
        { expiresIn: "7d" }
      );

      //Send the jwt in the response
      res.send({ "token": token });
    } catch (e) {
      console.log(e);
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
    let user;
    let code;
    await fetch(properties.get("user_db_url") + 'get/email/' + email, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }}).then(response => {
        code = response.status;
        return response.json()
    }).then(data => {
        user = User.from(data);
        console.log(data)
    }).catch(error => res.status(HttpStatus.UNAUTHORIZED).send( {"status": "Email is incorrect"} ));
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
    
    await fetch(properties.get("user_db_url") + 'update', {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
          'Content-type': 'application/json'
        }}).then(response => {
          code = response.status;
          return response.json()
      }).then(data => {
          console.log(data)
      }).catch(error => {
        console.error('Error:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
      });
      console.log(code);
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
      console.log(user.toJSON());
      
      let code;
      await fetch(properties.get("user_db_url") + 'create', {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
          'Content-type': 'application/json'
        }}).then(response => {
          code = response.status;
          return response.json()
      }).then(data => {
          console.log(data)
      }).catch(error => console.error('Error:', error));
      console.log(code);

      if (code != HttpStatus.OK) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
      }
      response = {success: "User created!"}
      res.status(HttpStatus.CREATED).send(response);
    } catch (error) {
      console.log(error)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }

}

export default AuthController;
