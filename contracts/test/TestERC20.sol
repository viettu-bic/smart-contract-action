// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("TestERC20", "TERC20") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
}
