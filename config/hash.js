const bcrypt = require('bcrypt');

const hash = async () => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('1234', salt);

    const valid = await bcrypt.compare(req.body.password, user.password);
    return hashed;
}