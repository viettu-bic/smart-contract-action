// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IEarning {
    function getEarningRate() external view returns (uint32, uint32);
    function setEarningRate(uint32 numerator, uint32 denominator) external;
    function calculateEarning(uint256 amount) external view returns (uint256);
}
