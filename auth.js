const argon2 = require("argon2"); // On importe le module argon2 pour le hachage sécurisé des mots de passe.

const hashingOptions = { // On paramètre des options de hachage
    type: argon2.argon2id, // Utilisation de l'algorithme argon2id
    memoryCost: 2 ** 16, 
    timeCost: 5,
    parallelism: 1, // Ces trois derniers éléments sont des paramètres techniques. Le coût en mémoire, le coût en temps et le nombre de processeurs parallèles utilisés.
  };
  
  const hashPassword = (req, res, next) => { // La mise en place du middleware pour le hachage du mot de passe, next nous indique que c'est un middleware 
    argon2
      .hash(req.body.password, hashingOptions) // La requête req.body.password contient le mdp en clair, que la fonction argon2.hash va traiter pour rendre sécurisé, on appelle aussi les options de hashing paramétrées précédemment. 
      .then((hashedPassword) => {
        req.body.hashedPassword = hashedPassword; // on va stocker le mot de passe haché dans la requête 
        delete req.body.password; // On supprime le mot de passe en clair
        next(); // On passe au middleware suivant 
      })
      .catch((err) => { // En cas d'erreur, on affiche un statut 500
        console.error(err);
        res.sendStatus(500);
      });
  };

  const verifyPassword = (req, res) => {
    argon2
      .verify(req.user.hashedPassword, req.body.password)
      .then((isVerified) => {
        if (isVerified) {
          const payload = { sub: req.user.id };
  
          const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h",
          });
  
          delete req.user.hashedPassword;
          res.send({ token, user: req.user });
        } else {
          res.sendStatus(401);
        }
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
  };


  const verifyToken = (req, res, next) => {
    try {
      const authorizationHeader = req.get("Authorization");
  
      if (authorizationHeader == null) {
        throw new Error("Authorization header is missing");
      }
  
      const [type, token] = authorizationHeader.split(" ");
  
      if (type !== "Bearer") {
        throw new Error("Authorization header has not the 'Bearer' type");
      }
  
      req.payload = jwt.verify(token, process.env.JWT_SECRET);
  
      next();
    } catch (err) {
      console.error(err);
      res.sendStatus(401);
    }
  };

module.exports = { // On exporte le middleware 
  hashPassword,
  verifyPassword,
  verifyToken,
};



