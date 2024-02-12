const users = [
  {
    id: 1,
    firstname: "John",
    lastname: "Doe",
    email: "john.doe@example.com",
    city: "Paris",
    language: "English",
  },

  {
    id: 2,
    firstname: "Valeriy",
    lastname: "Appius",
    email: "valeriy.appius@example.com",
    city: "Moscow",
    language: "Russian",
  },

  {
    id: 3,
    firstname: "Ralf",
    lastname: "Geronimo",
    email: "ralf.geronimo@example.com",
    city: "New York",
    language: "Italian",
  },

  {
    id: 4,
    firstname: "Maria",
    lastname: "Iskandar",
    email: "maria.iskandar@example.com",
    city: "New York",
    language: "German",
  },

  {
    id: 5,
    firstname: "Jane",
    lastname: "Doe",
    email: "jane.doe@example.com",
    city: "London",
    language: "English",
  },

  {
    id: 6,
    firstname: "Johanna",
    lastname: "Martino",
    email: "johanna.martino@example.com",
    city: "Milan",
    language: "Spanish",
  },
];

const argon2 = require('argon2'); // On appelle l'outil argon2

const database = require("../../database");

const { hashPassword } = require("../../auth"); // On appelle le fichier auth.js avec notre middleware paramétré 

const getUsers = (req, res) => {
  let sql = "Select * from users";
  const sqlValues = [];

  if (req.query.language != null && !req.query.city) {
    sql += " where language = ?";
    sqlValues.push(req.query.language);
  }

  if (req.query.city != null && !req.query.language) {
    sql += " where city = ?";
    sqlValues.push(req.query.city);
  }

  if (req.query.city != null && req.query.language != null) {
    sql += " where city = ? AND language = ?";
    sqlValues.push(req.query.city);
    sqlValues.push(req.query.language);
  }

  database
    .query(sql, sqlValues)
    .then(([users]) => {
      res.json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    });
};

const getUsersById = (req, res) => {
  const id = parseInt(req.params.id);

  database
    .query("SELECT * FROM users WHERE id = ?", [id])
    .then(([users]) => {
      if (users[0] != null) {
        res.json(users[0]);
      } else {
        res.sendStatus(404);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};


const getUserByEmailWithPasswordAndPassToNext = (req, res, next) => {
  const { email } = req.body;

  database
    .query("select * from users where email = ?", [email])
    .then(([users]) => {
      if (users[0] != null) {
        req.user = users[0];

        next();
      } else {
        res.sendStatus(401);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    });
};

const postUsers = [hashPassword, async (req, res) => { // Récupération du middleware qu'on intègre à la fonction
  const { firstname, lastname, email, city, language, hashedPassword } = req.body; // Récupération des données de la requête 

  try {
    const result = await database.query( // On insère des données dans la table des users, await sert à attendre la résolution de la promesse 
      "INSERT INTO users(firstname, lastname, email, city, language, hashedPassword ) VALUES (?, ?, ?, ?, ?, ?)",
      [firstname, lastname, email, city, language, hashedPassword]
    );

    res.status(201).json({ id: result.insertId, message: "User created/updated successfully" }); // Envoi d'une réponse JSON au statut 201 si ça marche
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Sinon, envoi d'un statut 500
  }
}];

const updateUsers = async (req, res) => {
  const userId = parseInt(req.params.id); // L'ID de l'utilisateur à mettre à jour est récupéré
  const { firstname, lastname, email, city, language, password } = req.body; // On récupère également les données de l'user. 
  
  // On remarque que nous n'avons pas eu besoin de récupérer la donnée hashedPassword parce que nous n'avons pas besoin de mettre à jour le mot de passe à chaque fois que nous mettons à jour les infos des users. Dans la plupart des cas, lors de la mise à jour des informations d'un utilisateur, le mot de passe n'est pas modifié à moins que l'utilisateur fournisse explicitement un nouveau mot de passe. Si le mot de passe n'est pas fourni dans la requête, cela signifie que vous ne souhaitez pas le mettre à jour, et donc, vous n'avez pas besoin de récupérer ou de traiter le champ password dans le corps de la requête.

   //La logique dans la fonction updateUsers est conçue pour vérifier si un nouveau mot de passe est fourni dans la requête (if (password)). Si c'est le cas, alors le mot de passe est haché avec Argon2 et inclus dans la mise à jour des champs. Si le mot de passe n'est pas fourni, il est simplement omis de la mise à jour, et la colonne hashedPassword dans la base de données reste inchangée.

   // Cela permet de rendre la mise à jour des informations de l'utilisateur plus flexible, en permettant aux utilisateurs de mettre à jour d'autres informations sans avoir à fournir un nouveau mot de passe à chaque fois.

  try {
    // Vérifier si l'utilisateur existe
    const userToUpdate = await database.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (userToUpdate.length === 0) {
      res.sendStatus(404); // Utilisateur non trouvé, on balance une erreur 404
    } else {
      // Mettre à jour les champs sauf le mot de passe s'il n'est pas fourni
      const updatedFields = ["firstname", "lastname", "email", "city", "language"];
      const updateValues = [firstname, lastname, email, city, language];

      // Mettre à jour le mot de passe s'il est fourni
      if (password) {
        const hashedPassword = await argon2.hash(password);
        updatedFields.push("hashedPassword");
        updateValues.push(hashedPassword);
      }

      // Construire la requête dynamique
      const updateQuery =
        "UPDATE users SET " +
        updatedFields.map((field) => `${field} = ?`).join(", ") +
        " WHERE id = ?";

        // Ce bout de code est complexe, essayons de le décrire :

        // updatedFields.map((field) => ${field} = ?).join(", ") : Cette partie utilise la méthode map pour créer une liste de chaînes de la forme "champ = ?" pour chaque champ à mettre à jour. Ensuite, la méthode join(", ") est utilisée pour concaténer ces chaînes avec une virgule et un espace entre elles. Cela crée la partie "SET" de la requête SQL.

        // Autrement dit, cette requête aurait pu être faite dans notre terminal directement sur notre BDD de cette manière
        // UPDATE users SET firstname = 'nouveau_nom', lastname = 'nouveau_prenom', city = 'nouvelle_ville' etc... WHERE id = 42;

      const updateParams = [...updateValues, userId];

      // Exécution de la requête de mise à jour avec database.query
      await database.query(updateQuery, updateParams);

      res.sendStatus(204); // Mise à jour réussie
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Erreur, balance un statut 500
  }
};


const deleteUsers = (req, res) => {
  const id = parseInt(req.params.id);

  database
    .query("delete from users where id = ?", [id])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

module.exports = {
  getUsers,
  getUsersById,
  postUsers,
  updateUsers,
  deleteUsers,
  getUserByEmailWithPasswordAndPassToNext,
};
