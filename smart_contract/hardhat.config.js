require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/s-CQxXzuWI8A95lxkHitTJxtOF_PvM6B',
      accounts: ['01d1ac4bdf3625fd0b5340551e71218d950b761f09d7005164db5a652bdc4d1d']
    }
  }
}