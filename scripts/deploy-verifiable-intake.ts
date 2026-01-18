/**
 * Deployment script for VerifiableIntakeProtocol
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-verifiable-intake.ts --network sepolia
 * 
 * Prerequisites:
 *   1. Install dependencies: npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
 *   2. Configure hardhat.config.ts with your network settings
 *   3. Set VERIFIABLE_INTAKE_ADMIN_ADDRESS in your .env
 */

// @ts-ignore - Hardhat Runtime Environment augmented types
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║         VerifiableIntakeProtocol Deployment                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
  console.log();

  // Get admin address from environment
  const adminAddress = process.env.VERIFIABLE_INTAKE_ADMIN_ADDRESS || deployer.address;
  
  if (adminAddress === deployer.address) {
    console.log("⚠️  Warning: Using deployer address as admin");
  }
  console.log("Admin address:", adminAddress);
  console.log();

  // Deploy the contract
  console.log("📝 Deploying VerifiableIntakeProtocol...");
  const VerifiableIntakeProtocol = await ethers.getContractFactory("VerifiableIntakeProtocol");
  const contract = await VerifiableIntakeProtocol.deploy(adminAddress);

  console.log("⏳ Waiting for deployment...");
  await contract.deployed();

  console.log();
  console.log("✅ VerifiableIntakeProtocol deployed successfully!");
  console.log();
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                  Deployment Information                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();
  console.log("Contract Address:", contract.address);
  console.log("Deployer:", deployer.address);
  console.log("Admin:", adminAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log();

  // Wait for a few block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await contract.deployTransaction.wait(5);
  console.log("✅ Confirmed!");
  console.log();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    Next Steps                                ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();
  console.log("1. Add the contract address to your .env.local:");
  console.log(`   NEXT_PUBLIC_VERIFIABLE_INTAKE_CONTRACT_ADDRESS=${contract.address}`);
  console.log();
  console.log("2. Verify the contract on Etherscan:");
  console.log(`   npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${contract.address} "${adminAddress}"`);
  console.log();
  console.log("3. Add intake officers using the admin account:");
  console.log(`   contract.addIntakeOfficer("0x...")`);
  console.log();
  console.log("4. Submit the contract for security audit:");
  console.log("   https://kairoaisec.com");
  console.log();

  // Optional: Add initial intake officer if specified
  const initialOfficer = process.env.INITIAL_INTAKE_OFFICER;
  if (initialOfficer) {
    console.log("➕ Adding initial intake officer:", initialOfficer);
    const tx = await contract.addIntakeOfficer(initialOfficer);
    await tx.wait();
    console.log("✅ Initial officer added!");
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error();
    console.error("❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });
