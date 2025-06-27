About the project:

Tokenium is a tool for players to make and play tabletop games. The project was my practical thesis (maturitní práce) for my highschool.
Full details about the project are in the text of the practical thesis.


Dependencies guide:

If you don't have it already, you need to install node.js from their site: https://nodejs.org/en
Restart your computer to let everything settle in.
Make sure the location of the installation folder (typically "C://Program Files/nodejs") is included in your PATH enviroment variable.

On your computer, open the folder of the github repository in visual studio code. Open a new terminal.
Make sure everything is working fine by running the following commands:

npm -v
node -v

If both return the version of npm and node respectively, you can run the following command to install electron:

npm install electron --save-dev

To run the project, run this command:

npm start

The project can also be run in debug mode (the windows will not be frameless - this allows the devtools to be accessed) using the command:

npm run start:debug
