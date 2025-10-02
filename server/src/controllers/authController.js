const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { password: _pw, ...safe } = user.toObject();

    const accessTokenTtlMinutes = parseInt(process.env.JWT_ACCESS_TTL_MINUTES || '15', 10);
    const refreshTokenTtlDays = parseInt(process.env.JWT_REFRESH_TTL_DAYS || '7', 10);

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const accessToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.user_type },
      jwtSecret,
      { expiresIn: `${accessTokenTtlMinutes}m` }
    );

    const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
    const refreshToken = jwt.sign(
      { sub: user._id.toString(), type: 'refresh' },
      refreshSecret,
      { expiresIn: `${refreshTokenTtlDays}d` }
    );

    return res.status(200).json({
      message: 'Login successful',
      user: safe,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: accessTokenTtlMinutes * 60,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login', error: error.message });
  }
}

// GET /auth/me
async function me(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const { password: _pw, ...safe } = user.toObject();
    return res.status(200).json({ user: safe });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch current user' });
  }
}

module.exports = { login, me };



