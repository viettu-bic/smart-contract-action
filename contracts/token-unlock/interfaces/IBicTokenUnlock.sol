// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IBicTokenUnlock {
    /**
     * @notice Claim fixed amount of token on arb chain
     * @param cycle number for new root generated
     * @param index user reward on array info during merkle tree generation
     * @param user address
     * @param claimIds array of claimId corresponding for weekly claim
     * @param claimTimestamps for claimable time
     * @param claimAmounts amount claim each week
     */
    function claim(
        uint256 cycle,
        uint256 index,
        address user,
        string[] calldata claimIds,
        uint256[] calldata claimTimestamps,
        uint256[] calldata claimAmounts,
        bytes32[] calldata merkleProof
    ) external;

    /**
     * @notice Checks whether a claim is valid or not
     * @param cycle number for new root generated
     * @param index user reward on array info during merkle tree generation
     * @param user address
     * @param claimIds array of claimId corresponding for weekly claim
     * @param claimTimestamps for claimable time
     * @param claimAmounts amount claim each week
     */
    function isValidClaim(
        uint256 cycle,
        uint256 index,
        address user,
        string[] calldata claimIds,
        uint256[] calldata claimTimestamps,
        uint256[] calldata claimAmounts,
        bytes32[] calldata merkleProof
    ) external view returns (bool);

    /**
     * @notice Fetch claimed amount since first cycle
     * @param user address
     */
    function getClaimedAmount(
        address user
    ) external view returns (uint256 userClaimedAmounts);
}
