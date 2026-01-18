import { expect } from "chai";
// @ts-ignore - Hardhat Runtime Environment augmented types
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VerifiableIntakeProtocol", function () {
  let contract: any; // Contract instance
  let admin: SignerWithAddress;
  let officer1: SignerWithAddress;
  let officer2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  beforeEach(async function () {
    // Get signers
    [admin, officer1, officer2, unauthorized] = await ethers.getSigners();

    // Deploy contract
    const VerifiableIntakeProtocol = await ethers.getContractFactory("VerifiableIntakeProtocol");
    contract = await VerifiableIntakeProtocol.deploy(admin.address);
    await contract.deployed();

    // Add intake officers
    await contract.connect(admin).addIntakeOfficer(officer1.address);
    await contract.connect(admin).addIntakeOfficer(officer2.address);
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      expect(await contract.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should start with zero reports", async function () {
      expect(await contract.totalReports()).to.equal(0);
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to add intake officers", async function () {
      const newOfficer = unauthorized.address;
      await contract.connect(admin).addIntakeOfficer(newOfficer);
      
      const INTAKE_OFFICER_ROLE = await contract.INTAKE_OFFICER_ROLE();
      expect(await contract.hasRole(INTAKE_OFFICER_ROLE, newOfficer)).to.be.true;
    });

    it("Should allow admin to remove intake officers", async function () {
      await contract.connect(admin).removeIntakeOfficer(officer1.address);
      
      const INTAKE_OFFICER_ROLE = await contract.INTAKE_OFFICER_ROLE();
      expect(await contract.hasRole(INTAKE_OFFICER_ROLE, officer1.address)).to.be.false;
    });

    it("Should not allow non-admin to add officers", async function () {
      await expect(
        contract.connect(unauthorized).addIntakeOfficer(unauthorized.address)
      ).to.be.reverted;
    });
  });

  describe("Report Submission", function () {
    it("Should allow intake officer to submit a report", async function () {
      const reportId = "RPT-001";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test report"));
      const nonce = 1;

      await contract.connect(officer1).submitReport(reportId, reportHash, nonce);

      expect(await contract.reportExists(reportId)).to.be.true;
      expect(await contract.totalReports()).to.equal(1);
    });

    it("Should emit ReportSubmitted event", async function () {
      const reportId = "RPT-002";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test report 2"));
      const nonce = 1;

      await expect(contract.connect(officer1).submitReport(reportId, reportHash, nonce))
        .to.emit(contract, "ReportSubmitted")
        .withArgs(reportId, reportHash, officer1.address, anyValue, anyValue);
    });

    it("Should not allow duplicate report IDs", async function () {
      const reportId = "RPT-003";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test report 3"));

      await contract.connect(officer1).submitReport(reportId, reportHash, 1);

      await expect(
        contract.connect(officer1).submitReport(reportId, reportHash, 2)
      ).to.be.revertedWithCustomError(contract, "ReportAlreadyExists");
    });

    it("Should not allow unauthorized submission", async function () {
      const reportId = "RPT-004";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test report 4"));

      await expect(
        contract.connect(unauthorized).submitReport(reportId, reportHash, 1)
      ).to.be.revertedWithCustomError(contract, "UnauthorizedAccess");
    });

    it("Should enforce nonce ordering", async function () {
      const reportId = "RPT-005";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test report 5"));

      // Try to submit with wrong nonce
      await expect(
        contract.connect(officer1).submitReport(reportId, reportHash, 5)
      ).to.be.revertedWith("Invalid nonce");

      // Submit with correct nonce
      await contract.connect(officer1).submitReport(reportId, reportHash, 1);
      
      // Next submission should use nonce 2
      await expect(
        contract.connect(officer1).submitReport("RPT-006", reportHash, 1)
      ).to.be.revertedWith("Invalid nonce");
    });

    it("Should validate report ID length", async function () {
      const tooLongId = "A".repeat(65);
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test"));

      await expect(
        contract.connect(officer1).submitReport(tooLongId, reportHash, 1)
      ).to.be.revertedWithCustomError(contract, "InvalidReportId");
    });

    it("Should not allow zero hash", async function () {
      const reportId = "RPT-007";
      const zeroHash = ethers.constants.HashZero;

      await expect(
        contract.connect(officer1).submitReport(reportId, zeroHash, 1)
      ).to.be.revertedWithCustomError(contract, "InvalidHash");
    });
  });

  describe("Report Retrieval", function () {
    beforeEach(async function () {
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test report"));
      await contract.connect(officer1).submitReport("RPT-100", reportHash, 1);
    });

    it("Should retrieve report details", async function () {
      const report = await contract.getReport("RPT-100");
      
      expect(report.exists).to.be.true;
      expect(report.intakeOfficer).to.equal(officer1.address);
      expect(report.blockNumber).to.be.gt(0);
    });

    it("Should get verification data", async function () {
      const [hash, timestamp, officer, blockNumber] = 
        await contract.getReportVerificationData("RPT-100");
      
      expect(hash).to.not.equal(ethers.constants.HashZero);
      expect(timestamp).to.be.gt(0);
      expect(officer).to.equal(officer1.address);
      expect(blockNumber).to.be.gt(0);
    });

    it("Should return false for non-existent reports", async function () {
      expect(await contract.reportExists("RPT-999")).to.be.false;
    });

    it("Should revert when getting non-existent report", async function () {
      await expect(
        contract.getReport("RPT-999")
      ).to.be.revertedWithCustomError(contract, "ReportNotFound");
    });
  });

  describe("Commitment Scheme", function () {
    it("Should allow commitment submission", async function () {
      const commitment = ethers.utils.sha256(ethers.utils.toUtf8Bytes("commitment"));
      
      await expect(contract.connect(officer1).commitToSubmission(commitment))
        .to.emit(contract, "CommitmentMade")
        .withArgs(commitment, officer1.address);
    });

    it("Should verify valid commitments", async function () {
      const reportId = "RPT-200";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test"));
      const nonce = 1;
      const secret = ethers.utils.sha256(ethers.utils.toUtf8Bytes("secret"));

      const commitment = await contract.generateCommitment(reportId, reportHash, nonce, secret);
      await contract.connect(officer1).commitToSubmission(commitment);

      expect(
        await contract.verifyCommitment(reportId, reportHash, nonce, secret)
      ).to.be.true;
    });

    it("Should not allow duplicate commitments", async function () {
      const commitment = ethers.utils.sha256(ethers.utils.toUtf8Bytes("commitment"));
      
      await contract.connect(officer1).commitToSubmission(commitment);
      
      await expect(
        contract.connect(officer1).commitToSubmission(commitment)
      ).to.be.revertedWith("Commitment already exists");
    });
  });

  describe("Pausable", function () {
    it("Should allow admin to pause", async function () {
      await contract.connect(admin).pause();
      
      const reportId = "RPT-300";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test"));
      
      await expect(
        contract.connect(officer1).submitReport(reportId, reportHash, 1)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow admin to unpause", async function () {
      await contract.connect(admin).pause();
      await contract.connect(admin).unpause();
      
      const reportId = "RPT-301";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test"));
      
      await contract.connect(officer1).submitReport(reportId, reportHash, 1);
      expect(await contract.reportExists(reportId)).to.be.true;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(
        contract.connect(unauthorized).pause()
      ).to.be.reverted;
    });
  });

  describe("Batch Operations", function () {
    beforeEach(async function () {
      // Submit multiple reports
      for (let i = 0; i < 5; i++) {
        const reportId = `RPT-${400 + i}`;
        const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(`report ${i}`));
        await contract.connect(officer1).submitReport(reportId, reportHash, i + 1);
      }
    });

    it("Should get all report IDs", async function () {
      const allIds = await contract.getAllReportIds();
      expect(allIds.length).to.equal(5);
    });

    it("Should get report IDs in batches", async function () {
      const batch = await contract.getReportIdsBatch(0, 3);
      expect(batch.length).to.equal(3);
      expect(batch[0]).to.equal("RPT-400");
    });

    it("Should handle batch overflow gracefully", async function () {
      const batch = await contract.getReportIdsBatch(0, 100);
      expect(batch.length).to.equal(5);
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct statistics", async function () {
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test"));
      await contract.connect(officer1).submitReport("RPT-500", reportHash, 1);
      
      const [totalReports, totalOfficers, _] = await contract.getContractStats();
      
      expect(totalReports).to.equal(1);
      expect(totalOfficers).to.equal(2); // officer1 and officer2
    });
  });

  describe("Report Integrity Verification", function () {
    it("Should verify report integrity correctly", async function () {
      const content = "This is a test report";
      const contentBytes = ethers.utils.toUtf8Bytes(content);
      const reportHash = ethers.utils.sha256(contentBytes);
      const reportId = "RPT-600";

      await contract.connect(officer1).submitReport(reportId, reportHash, 1);

      expect(
        await contract.verifyReportIntegrity(reportId, contentBytes)
      ).to.be.true;
    });

    it("Should reject tampered content", async function () {
      const originalContent = "Original report";
      const tamperedContent = "Tampered report";
      const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(originalContent));
      const reportId = "RPT-601";

      await contract.connect(officer1).submitReport(reportId, reportHash, 1);

      expect(
        await contract.verifyReportIntegrity(
          reportId, 
          ethers.utils.toUtf8Bytes(tamperedContent)
        )
      ).to.be.false;
    });
  });
});

// Helper for any value matching in events
const anyValue = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
