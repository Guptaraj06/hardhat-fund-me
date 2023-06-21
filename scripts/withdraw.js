const { ethers, getNamedAccounts, deployments } = require('hardhat');

async function main() {
  const { deployer } = await getNamedAccounts();

  const fundMe = await deployments.get('FundMe');
  const fundMeA = await ethers.getContractAt('FundMe', fundMe.address);
  console.log(`Got Contract At ${fundMe.address}`);
  const transactionResponse = await fundMeA.withdraw();
  await transactionResponse.wait(1);
  console.log('Got it back');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
