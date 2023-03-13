const fs = require('fs');
const express = require('express');
const multer = require('multer');
const exphbs = require('express-handlebars');

const PUERTO = 8081;
const app = express();
const hbs = exphbs.create();
const path = require('path');


const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, './uploads/imagenes');
    },
    filename(req, file, cb) {
      cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, '../public')));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/uploads`));



function getTeamsJSON(teamsJSON, value) {
  const team = teamsJSON.filter((element) => element.tla === value);
  return team[0];
}

function createNewTeam(team, file) {
  const newTeam = {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    tla: team.tla,
    email: team.email,
    area: {
      name: team.countryName,
    },
    phone: team.phone,
    website: team.webSite,
    founded: team.founded,
    address: team.address,
    clubColors: team.colors,
    venue:team.stadium,
    crestUrl: team.urlImage,
    crestLocal: file === 'crest' ? team.localImage : `/imagenes/${file}`,
  };
  return newTeam;
}

function saveTla(teams) {
  const tlaTeams = [];
  teams.forEach((team) => {
    tlaTeams.push(team.tla);
  });
  return tlaTeams;
}

app.get('/', (req, res) => {
  
    const clubs = JSON.parse(fs.readFileSync('./data/teams.db.json'));
    res.render('body', {
      layout: 'main',
      data:{clubs},
    });
  });

app.get('/add', (req, res) => {
  res.render('add', {
    layout: 'main',
  });
});

app.get('/view/:tla', (req, res) => {
  const teams = JSON.parse(fs.readFileSync('./data/teams.db.json'));
  const players = JSON.parse(fs.readFileSync(`./data/teams/${req.params.tla}.json`));
  const team = players.squad;
  const data = getTeamsJSON(teams, `${req.params.tla}`);
  res.render('club', {
    layout: 'main',
    data,
  });
});

app.get('/delete/:tla', (req, res) => {
  const teams = JSON.parse(fs.readFileSync('./data/teams.db.json'));
  const remainingTeams = teams.filter((team) => team.tla !== `${req.params.tla}`);
  fs.writeFileSync('./data/teams.db.json', JSON.stringify(remainingTeams));
  res.redirect('/');
});

app.get('/edit/:tla', (req, res) => {
  const teams = JSON.parse(fs.readFileSync('./data/teams.db.json'));
  const data = getTeamsJSON(teams, `${req.params.tla}`);
  res.render('edit', {
    layout: 'main',
    data,
  });
});

app.post('/add', upload.single('image'), (req, res) => {
  const teams = JSON.parse(fs.readFileSync('./data/teams.db.json'));
  const checkTla = saveTla(teams);
  if (checkTla.find((element) => element === req.body.tla) !== undefined) {
    res.render('add', {
      layout: 'main',
      data: {
        error: `El tla ${req.body.tla} ya fue usado.`,
      },
    });
  } else {
    const newTeam = createNewTeam(req.body, req.file ? req.file.originalname : undefined);
    teams.push(newTeam);
    fs.writeFileSync('./data/teams.db.json', JSON.stringify(teams));
    fs.writeFileSync(`./data/teams/${req.body.tla}.json`, JSON.stringify(newTeam));
    res.redirect('/');
  }
});

app.post('/edit/:tla', upload.single('image'), (req, res) => {
  const teams = JSON.parse(fs.readFileSync('./data/teams.db.json'));
  const editedTeam = createNewTeam(req.body, req.file ? req.file.originalname : undefined);
  const index = teams.findIndex((team) => team.tla === `${req.params.tla}`);
  teams[index] = editedTeam;
  fs.writeFileSync('./data/teams.db.json', JSON.stringify(teams));
  res.redirect(`/view/${editedTeam.tla}`);
});


// app.post('/edit/:tla', upload.single('image'), (req, res) => {
//   const teams = JSON.parse(fs.readFileSync('./data/teams.db.json'));
//   const remainingTeams = teams.filter((team) => team.tla !== `${req.params.tla}`);
//   if (req.file !== undefined) {
//     remainingTeams.push(createNewTeam(req.body, req.file.originalname));
//   } else {
//     remainingTeams.push(createNewTeam(req.body, req.file !== undefined));
//   }
//   fs.writeFileSync('./data/teams.db.json', JSON.stringify(teams));
//   res.redirect('/');
// });


app.get('/reset', (req, res) => {
  const equiposTotales = JSON.parse(fs.readFileSync('./data/teams.json'));
  fs.writeFileSync('./data/teams.db.json', JSON.stringify(equiposTotales));
  res.redirect('/');
});

app.listen(PUERTO);

