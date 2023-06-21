const { assert, expect } = require('chai');
const { network, deployments, ethers, getNamedAccounts } = require('hardhat');
const {
  networkConfig,
  developmentChains,
} = require('../../helper-hardhat-config');
!developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', function () {
      let fundMe;
      let mockV3Aggregator;
      let deployer;
      let fundMeA;
      let mockV3AggregatorA;
      const sendValue = ethers.parseEther('1.0');

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture(['all']); //deploy the smart contracts;

        fundMe = await deployments.get('FundMe');
        mockV3Aggregator = await deployments.get('MockV3Aggregator');

        console.log('Contract A address:', fundMe.address);
        console.log('Contract B address:', mockV3Aggregator.address);

        fundMeA = await ethers.getContractAt('FundMe', fundMe.address);
        mockV3AggregatorA = await ethers.getContractAt(
          'MockV3Aggregator',
          mockV3Aggregator.address
        );
      });

      describe('constructor', function () {
        it('set the aggregator addresses correctly', async () => {
          const response = await fundMeA.getPriceFeed();
          console.log(response);
          assert.equal(response, mockV3Aggregator.address);
        });
      });
      describe('fund', function () {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMeA.fund()).to.be.revertedWith(
            'you need to spend more ETH!'
          );
        });
        it('Updates the amount funded data structure', async () => {
          await fundMeA.fund({ value: sendValue });
          const response = await fundMeA.getAddressToAmountFunded(deployer);
          console.log(sendValue.toString());
          assert.equal(response.toString(), sendValue.toString());
        });
        it('Adds funder to array of funders', async () => {
          await fundMeA.fund({ value: sendValue });
          const response = await fundMeA.getFunder(0);
          assert.equal(response, deployer);
        });
      });
      describe('withdraw', function () {
        beforeEach(async () => {
          await fundMeA.fund({ value: sendValue });
        });
        it('withdraw ETH from a single funder', async () => {
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          //console.log(startingFundMeBalance, startingDeployerBalance);
          const transactionResponse = await fundMeA.withdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, gasPrice } = transactionReceipt;
          //console.log(gasPrice);
          ///console.log(transactionReceipt);
          /*const gasCost = ethers.BigNumber.from(gasUsed).mul(
        ethers.BigNumber.from(gasPrice)
      );*/

          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });
        it('is allow us to withdraw with multiple funders', async () => {
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMeA.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          console.log(startingFundMeBalance, startingDeployerBalance);
          const transactionResponse = await fundMeA.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
          await expect(fundMeA.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMeA.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        it('Only allows the owner to withdraw', async function () {
          const accounts = await ethers.getSigners();
          const fundMeConnectedContract = await fundMeA.connect(accounts[1]);
          await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
            'FundMe__NotOwner'
          );
        });
      });
    });
