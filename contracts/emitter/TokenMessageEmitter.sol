// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenMessageEmitter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    event ERC20Message(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        string message
    );

     event ERC20Charge(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        string message
    );
    
    event WithdrawToken(
        IERC20 indexed token,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    constructor() {}

    function transferERC20(
        IERC20 _token,
        address _to,
        uint256 _amount,
        string calldata _message
    ) external {
        require(_amount > 0, "PMS: Amount must be greater than zero");
        _token.safeTransferFrom(_msgSender(), _to, _amount);
        emit ERC20Message(_token, _msgSender(), _to, _amount, _message);
    }

    function charge(
        IERC20 _token,
        uint256 _amount,
        string calldata _message
    ) external {
        require(_amount > 0, "PMS: Amount must be greater than zero");
        _token.safeTransferFrom(_msgSender(), address(this), _amount);
        emit ERC20Charge(_token, _msgSender(), address(this), _amount, _message);
    }

    function withdrawToken(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(_amount > 0, "PMS: Amount must be greater than zero");
        _token.safeTransfer(_to, _amount);
        emit WithdrawToken(_token, _msgSender(), _to, _amount);
    }
}
