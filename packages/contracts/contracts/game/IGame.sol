//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "../shuffle/IShuffle.sol";

enum Type {
    DEAL,
    OPEN
}

enum ActionState {
    NOTSTART,
    ONGOING,
    DONE
}

struct Action {
    Type t;
    ActionState state;
    uint cardIdx;     // Next Version : uint[] for arbitry card/player
    uint playerIdx;
}

interface IGame {
    function shuffleContract() external view returns (address);

    function newGame(
        uint numCards,
        uint numPlayers,
        Action[] calldata actions
    ) external returns (uint gid);


    function joinGame(
        address account,
        uint[2] memory pk,
        uint gameId
    ) external;


}