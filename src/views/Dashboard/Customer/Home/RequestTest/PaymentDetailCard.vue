<template lang="pug">
v-container.container-card
  v-skeleton-loader(
    v-if="fetching"
    type="card"
    width="300"
  )

  v-card.menu-card(v-if=!fetching)
    .menu-card__title Order Summary

    .menu-card__sub-title-medium Details

    hr.menu-card__line

    .menu-card__details
      .menu-card__sub-title Service Price
      .menu-card__price 
        | {{ dataService.servicePrice }}
        | {{ formatUSDTE(dataService.currency) }}

    .menu-card__details
      .menu-card__sub-title Quality Control Price
      .menu-card__price 
        | {{ dataService.qcPrice }} 
        | {{ formatUSDTE(dataService.currency) }}

    .menu-card__operation +
    hr.menu-card__line

    .menu-card__details
      .menu-card__sub-title-medium Total Price
      .menu-card__price-medium
        | {{ dataService.totalPrice }} 
        | {{ formatUSDTE(dataService.currency)}}

    .menu-card__rate ( {{ this.usdRate }} USD )

    .menu-card__details.mt-5(v-if="$route.name === 'customer-request-test-checkout'")
      .menu-card__trans-weight Estimated Transaction Weight
        v-tooltip.visible(bottom)
          template(v-slot:activator="{ on, attrs }")
            v-icon.menu-card__icon(
              color="primary"
              dark
              v-bind="attrs"
              v-on="on"
            ) mdi-alert-circle-outline 
          span(style="font-size: 10px;") Total fee paid in DBIO to execute this transaction.
      .menu-card__trans-weight-amount {{ Number(txWeight).toFixed(4) }} DBIO

    div(class="text-center" v-if="$route.name === 'customer-request-test-checkout' && status === 'Cancelled'")
      div(class="d-flex justify-space-between align-center pa-4 ms-3 me-3")
        ui-debio-button(
          color="secondary"
          width="49%"
          height="35"
          @click="toDashboard"
          style="font-size: 10px;"
          outlined 
          ) Go to Dashboard

        ui-debio-button(
          color="secondary"
          width="49%"
          height="35"
          style="font-size: 9px;"
          @click="toPaymentHistory"
          ) Go To Payment History

    div(class="text-center" v-else)
      div(v-if="status === 'Paid'" class="d-flex justify-space-between align-center pa-4 ms-3 me-3")
        ui-debio-button(
          color="secondary"
          width="50%"
          height="35"
          style="font-size: 9px;"
          @click="toPaymentHistory"
          outlined
          ) Go To Payment History

        ui-debio-button(
          color="secondary"
          width="42%"
          height="35"
          @click="toInstruction(dataService.dnaCollectionProcess)"
          style="font-size: 9px;"
          ) Obtain Kit Here

      div(v-if="$route.name === 'customer-request-test-checkout'" class="d-flex justify-space-between align-center pa-4 ms-3 me-3")
        ui-debio-button(
          color="primary"
          width="46%"
          height="35"
          @click="showCancelConfirmation"
          style="font-size: 10px;"
          outlined 
          :loading="loading"
          :disabled="loadingPayment"
          ) Cancel Order

        ui-debio-button(
          color="secondary"
          width="46%"
          height="35"
          style="font-size: 10px;"
          @click="onSubmit"
          :disabled="loading"
          :loading="loadingPayment"
          ) Pay

    CancelDialog(
      :show="cancelDialog"
      :orderId="orderId"
      @cancel="setCancelled"
      @close="cancelDialog = false"
    )

    ui-debio-alert-dialog(
      :show="showAlert"
      :width="289"
      title="Unpaid Order"
      message="Complete your unpaid order first before requesting a new one. "
      imgPath="alert-circle-primary.png"
      btn-message="Go to My Payment"
      @close="showAlert = false"
      @click="toPaymentHistory"
    )

    ui-debio-error-dialog(
      :show="showError"
      :title="errorTitle"
      :message="errorMsg"
      @close="showError = false"
    )

    PaymentDialog(
      :show="loadingPayment"
      )
</template>

<script>
import { mapState, mapMutations } from "vuex";
import CryptoJS from "crypto-js";
import Kilt from "@kiltprotocol/sdk-js";
import { u8aToHex } from "@polkadot/util";
import CancelDialog from "@/common/components/Dialog/CancelDialog";
import { cancelOrder } from "@debionetwork/polkadot-provider";
import {
  queryLastOrderHashByCustomer,
  queryOrderDetailByOrderID
} from "@debionetwork/polkadot-provider";
import {
  setOrderPaidFee,
  setOrderPaid
} from "@/common/lib/polkadot-provider/command/order";
import { getConversion, getOrderDetail } from "@/common/lib/api";
import { getDNACollectionProcess } from "@/common/lib/api";
import { errorHandler } from "@/common/lib/error-handler";
import { createOrder } from "@/common/lib/polkadot-provider/command/order";
import { formatUSDTE } from "@/common/lib/price-format.js";
import { processRequest } from "@/common/lib/polkadot-provider/command/service-request";
import PaymentDialog from "@/common/components/Dialog/PaymentDialog"
export default {
  name: "PaymentDetailCard",

  components: {
    CancelDialog,
    PaymentDialog
  },

  data: () => ({
    newService: false,
    lastOrder: null,
    detailOrder: null,
    cancelDialog: false,
    isCancelled: false,
    status: "Unpaid",
    labDetail: null,
    orderId: "",
    showAlert: false,
    showError: false,
    isCreated: false,
    success: false,
    loading: false,
    rate: null,
    usdRate: null,
    txWeight: "",
    errorTitle: "",
    errorMsg: "",
    loadingPayment: false,
    fetching: false,
    formatUSDTE
  }),

  async mounted() {
    if (
      this.$route.name === "customer-request-test-checkout" &&
      !this.dataService
    ) {
      this.toDashboard();
      return;
    }

    if (this.$route.name === "customer-request-test-success") {
      this.success = true;
    }

    if (this.$route.params.id) {
      this.isCreated = true;
      const orderId = this.$route.params.id;

      this.lastOrder = await queryLastOrderHashByCustomer(
        this.api,
        this.wallet.address
      );

      if (this.lastOrder) {
        const detailOrder = await queryOrderDetailByOrderID(this.api, orderId);
        this.detailOrder = detailOrder;
        this.orderId = this.detailOrder.id;
        this.status = this.detailOrder.status;
      }
    }

    await this.getUsdRate();
    await this.calculateTxWeight();
  },

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      mnemonicData: (state) => state.substrate.mnemonicData,
      dataService: (state) => state.testRequest.products,
      metamaskWalletAddress: (state) => state.metamask.metamaskWalletAddress,
      stakingData: (state) => state.lab.stakingData,
      web3: (state) => state.metamask.web3,
      lastEventData: (state) => state.substrate.lastEventData,
      usdtBalance: (state) => state.substrate.usdtBalance,
      polkadotWallet: (state) => state.substrate.polkadotWallet
    })
  },

  watch: {
    async lastEventData(event) {
      const dataEvent = JSON.parse(event.data.toString());
      const orderId = dataEvent[0].id;
      this.status = dataEvent.status;

      if (!event) return;
      if (event.method === "OrderCancelled" && this.isCancelled) {
        this.loading = false;
        this.$router.push({
          name: "customer-request-test-canceled",
          params: {
            hash: this.$route.params.id || this.$route.params.hash
          }
        });
      }

      if (event.method === "OrderCreated") {
        await this.setPaid(orderId);
      }

      if (event.method === "OrderPaid") {
        if (dataEvent[0].orderFlow === "RequestTest") {
          this.loadingPayment = false;
          this.success = true;

          this.$router.push({
            name: "customer-request-test-success",
            params: {
              id: dataEvent[0].id
            }
          });
          return;
        }

        await this.processRequestService(dataEvent[0]);
      }

      if (event.method === "ServiceRequestUpdated")
        this.$router.push({ name: "customer-request-test-success" });
    },

    dataService(val) {
      if (val) this.getUsdRate();
    }
  },

  methods: {
    ...mapMutations({
      setProductsToRequest: "testRequest/SET_PRODUCTS"
    }),

    async calculateTxWeight() {
      this.txWeight = "Calculating...";

      this.lastOrder = await queryLastOrderHashByCustomer(
        this.api,
        this.wallet.address
      );

      const txWeight = await setOrderPaidFee(
        this.api,
        this.wallet,
        this.dataService.serviceId
      );
      this.txWeight = this.web3.utils.fromWei(
        String(txWeight.partialFee),
        "ether"
      );
    },

    async processRequestService(event) {
      await processRequest(
        this.api,
        this.wallet,
        this.stakingData.hash,
        event.id
      );
    },

    async getUsdRate() {
      this.fetching = true;
      let totalPrice;

      if (this.$route.params.id) {
        totalPrice = this.dataService.totalPrice;
      } else {
        totalPrice = this.dataService.totalPrice.split(",").join("");
      }

      this.rate = await getConversion(this.dataService.currency, "USD");
      this.usdRate = Number(this.rate.conversion * totalPrice).toFixed(4);
      this.fetching = false;
    },

    toPaymentHistory() {
      this.$router.push({ name: "customer-payment-history" });
    },

    async onSubmit() {
      this.loadingPayment = true;

      try {
        const balance = this.usdtBalance;
        if (
          Number(balance) - 0.1 <=
          Number(this.dataService.totalPrice.replaceAll(",", ""))
        ) {
          this.loadingPayment = false;
          this.showError = true;
          const error = await errorHandler("Insufficient Balance");
          this.error = error.message;
          this.errorTitle = error.title;
          this.errorMsg = error.message;
          return;
        }

        if (this.isCreated) {
          this.lastOrder = await queryLastOrderHashByCustomer(
            this.api,
            this.wallet.address
          );

          await setOrderPaid(this.api, this.wallet, this.lastOrder);
          return;
        }

        await this.createOrder();
      } catch (err) {
        this.loadingPayment = false;
        const error = await errorHandler(err.message);
        this.showError = true;
        this.errorTitle = error.title;
        this.errorMsg = error.message;
      }
    },

    async setPaid(id) {
      await setOrderPaid(this.api, this.wallet, id);
    },

    async createOrder() {
      const assetId = await this.getAssetId(
        this.dataService.currency === "USDTE"
          ? "USDT.e"
          : this.dataService.currency
      );
      const customerBoxPublicKey = await this.getCustomerPublicKey();
      const indexPrice = 0;
      await createOrder(
        this.api,
        this.wallet,
        this.dataService.serviceId,
        indexPrice,
        customerBoxPublicKey,
        this.dataService.serviceFlow,
        assetId
      );
    },

    async getAssetId(currency) {
      let assetId = 0;
      const wallet = this.polkadotWallet.find(
        (wallet) => wallet?.currency?.toUpperCase() === currency?.toUpperCase()
      );
      assetId = wallet.id;
      return assetId;
    },

    getCustomerPublicKey() {
      const identity = Kilt.Identity.buildFromMnemonic(
        this.mnemonicData.toString(CryptoJS.enc.Utf8)
      );
      this.publicKey = u8aToHex(identity.boxKeyPair.publicKey);
      this.secretKey = u8aToHex(identity.boxKeyPair.secretKey);
      return u8aToHex(identity.boxKeyPair.publicKey);
    },

    async toInstruction(val) {
      const description = this.dataService.longDescription.split("||");

      if (description.length > 1) {
        window.open(description[1], "_blank");
        return;
      }

      const dnaCollectionProcess = await getDNACollectionProcess();
      const link = dnaCollectionProcess.filter(
        (e) => e.collectionProcess === val
      )[0].link;
      window.open(link, "_blank");
    },

    showCancelConfirmation() {
      if (!this.isCreated) {
        this.toDashboard();
        return;
      }

      this.cancelDialog = true;
    },

    async setCancelled() {
      this.loading = true;
      this.isCancelled = true;

      await cancelOrder(this.api, this.wallet, this.$route.params.id);
    },

    toDashboard() {
      this.$router.push({ name: "customer-dashboard" });
    },

    async getDataService() {
      const data = await getOrderDetail(this.$route.params.id);

      if (data.status !== "Unpaid") {
        this.$router.push({ name: "customer-payment-history" });
      }

      const service = {
        serviceId: data.service_id,
        serviceName: data.service_info.name,
        serviceRate: 0,
        serviceImage: data.service_info.image,
        serviceCategory: data.service_info.category,
        serviceDescription: data.service_info.description,
        labName: data.lab_info.name,
        labId: data.seller_id,
        labImage: data.lab_info.profile_image,
        labRate: 0,
        labAddress: data.lab_info.address,
        price: data.service_info.prices_by_currency[0].total_price.replaceAll(
          ",",
          ""
        ),
        detailPrice: data.service_info.prices_by_currency[0],
        currency: data.service_info.prices_by_currency[0].currency,
        city: data.lab_info.city,
        country: data.lab_info.country,
        region: data.lab_info.region,
        countRateLab: 0,
        countServiceRate: 0,
        duration: data.service_info.expected_duration.duration,
        durationType: data.service_info.expected_duration.durationType,
        verificationStatus: "Verified",
        indexPrice: 0,
        dnaCollectionProcess: data.service_info.dna_collection_process
      };

      this.setProductsToRequest(service);
    }
  }
};
</script>

<style lang="sass" scoped>
@import "@/common/styles/mixins.sass"

.container-card
  width: 360px
  height: 328px
  border-radius: 8px

.menu-card
  border-radius: 8px
  padding: 2px
  height: 320px

  &__title
    margin-top: 30px
    margin-bottom: 25px
    justify-content: center
    display: flex
    @include h6-opensans

  &__sub-title
    margin-left: 38px
    @include body-text-3-opensans

  &__sub-title-medium
    margin-left: 38px
    @include body-text-3-opensans-medium

  &__price
    margin-right: 38px
    @include body-text-3-opensans

  &__price-medium
    margin-right: 38px
    @include body-text-3-opensans-medium

  &__line
    margin: 1px 24px

  &__details
    display: flex
    justify-content: space-between

  &__rate
    display: flex
    align-items: center
    justify-content: flex-end
    margin-right: 38px
    @include tiny-reg

  &__operation
    margin-right: 24px
    display: flex
    justify-content: flex-end
    @include body-text-3-opensans-medium

  &__trans-weight
    margin-left: 38px
    @include tiny-reg

  &__trans-weight-amount
    margin-right: 38px
    @include tiny-reg

  &__icon
    margin-left: 5px
    @include body-text-3-opensans-medium
</style>
