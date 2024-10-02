import express from "express";

import AssetsController from "../controllers/AssetsController";
import BalanceController from "../controllers/BalanceController";
import CollectionController from "../controllers/CollectionController";
import SalesController from "../controllers/SalesController";
import TokensMarketController from "../controllers/TokensMarketController";
import UsersController from "../controllers/UserController";
import WashTradingController from "../controllers/WashTradingController";
import { checkTokenMiddleware } from "../middlewares/checkToken";

const router = express.Router();

router.get("/collection", CollectionController.index);
router.get("/collection/status/:name", CollectionController.status);
router.get("/collection/schemas/:name", CollectionController.schemas);
router.get("/collection/accounts/:name", CollectionController.accounts);
router.get("/collection/assets/:name", CollectionController.assets);
router.get("/collection/market/:name", CollectionController.market);
router.get("/collection/filters/:name", CollectionController.filters);
router.post(
  "/collection/assessments",
  checkTokenMiddleware,
  CollectionController.assessments,
);
router.get("/collection/assessments", CollectionController.consultAssessment);
router.get("/collection/scores", CollectionController.voyagerScores);
router.get("/collection/pairs", CollectionController.pairs);
router.get("/collection/holders/:name", CollectionController.holders);

router.get("/user/assets/:wallet", (req, res) => {
  new AssetsController().byUser(req, res);
});

router.get("/user/balance/:name", BalanceController.byUser);

router.get("/assets/graph/:template", (req, res) => {
  new AssetsController().graph(req, res);
});

// wash trading routes
router.get("/washtrading/:name", WashTradingController.byCollection);

// sales/auctions/offers routes
router.get("/sales/:collection", SalesController.sales);
router.get("/auctions/:collection", SalesController.auctions);

// get tokens(in wax) value in market
router.get("/tokens/market/", TokensMarketController.fullMarket);
router.get("/tokens/market/:token", TokensMarketController.marketByToken);

// get users for dashboard
router.get("/dashboard/users/:wallet", UsersController.getUsers);

export default router;
