const { assert } = require('chai');
const { network, ethers, getNamedAccounts, deployments } = require('hardhat');

const { developmentChains } = require('../../helper-hardhat-config');

developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe Staging Test', function () {
      let deployer;
      let fundMe;
      let fundMeA;
      const sendValue = ethers.parseEther('0.1');
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;

        fundMe = await deployments.get('FundMe');

        console.log('Contract A address:', fundMe.address);

        fundMeA = await ethers.getContractAt('FundMe', fundMe.address);
      });
      it('allows people to fund and withdraw', async function () {
        const fundTxResponse = await fundMeA.fund({ value: sendValue });
        await fundTxResponse.wait(1);
        const withdrawTxResponse = await fundMeA.withdraw();
        await withdrawTxResponse.wait(1);
        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.address
        );
        console.log(
          endingFundMeBalance.toString() +
            ' should equal 0, running assert equal...'
        );
        assert.equal(endingFundMeBalance.toString(), '0');
      });
    });
