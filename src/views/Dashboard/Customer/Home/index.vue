<template lang="pug">
.customer-dashboard
  ui-debio-banner.customer-dashboard__banner(
    title="Dashboard"
    subtitle="DeBio is a Privacy Focused Platform for Personal Biomedical Testing."
    with-decoration
    gradient-color="violet"
  )

    template(slot="cta")
      .banner-card
        router-link.banner-card__container(v-for="banner in banners" :key="banner.id" :to="{ name: banner.link}")
          ui-debio-icon.banner-card__icon(
            :icon="banner.icon"
            size="50"
          )
          .banner-card__text {{ banner.text }}

  .customer-dashboard__tables
    .tables
      .tables__tabs
        v-tabs(v-model="tabs")
          v-tab.tab-section Recent Order
          v-tab.tab-section Recent Payments
        v-tabs-items.tables__contents(v-model="tabs")
          v-tab-item
            ui-debio-data-table.content(
              :headers="headers"
              :items="testList"
              :page="1"
              :loading="isLoadingTest"
            )
              template(class="status" v-slot:[`item.formated_id`]="{item}")
                span(:aria-label="item.id" :title="item.id") {{ item.formated_id }}

              template(class="status" v-slot:[`item.service_info.name`]="{item}")
                div(class="d-flex align-center")
                  ui-debio-avatar.serviceImage(
                    :src="setServiceImage(item.service_info.image)"
                    size="41"
                    rounded
                  )
                  div(class="fluid")
                    .d-flex.flex-column.customer-dashboard__order-service-name
                      span {{ item.service_info.name }}
                    .d-flex.flex-column.customer-dashboard__order-service-sample-id
                      span {{ item.dna_sample_tracking_id}}

              template(class="status" v-slot:[`item.status`]="{item}") 
                .d-flex.flex-column.customer-dashboard__order
                  span(:style="{color: setStatusColor(item.status)}") {{ setTestStatus(item.status) }}

              template(v-slot:[`item.actions`]="{item}")
                ui-debio-icon.iconTable(
                  :icon="eyeIcon"
                  role="button"
                  slot="icon" size="20"
                  color="#C400A5"
                  stroke
                  @click="goToOrderDetail(item)"
                )
          v-tab-item
            ui-debio-data-table(
              :headers="headers"
              :items="paymentHistory"
              :page="2"
              :loading="isLoadingPayments"
            )
              template(class="status" v-slot:[`item.service_info.name`]="{item}")
                div(class="d-flex align-center")
                  ui-debio-avatar.serviceImage(
                    :src="setServiceImage(item.provider_service_image)"
                    size="41"
                    rounded
                  )
                  div(class="fluid")
                    .d-flex.flex-column.customer-dashboard__order-service-name
                      span {{ item.service_info.name }}
                    .d-flex.flex-column.customer-dashboard__order-service-sample-id
                      span {{ item.tracking_id}}

              template(class="status" v-slot:[`item.status`]="{item}") 
                .d-flex.flex-column.customer-dashboard__order
                  span(:style="{color: setPaymentStatusColor(item.status)}") {{ item.status }}

              template(v-slot:[`item.actions`]="{item}")
                ui-debio-icon.iconTable(
                  :icon="eyeIcon"
                  role="button"
                  slot="icon"
                  size="20"
                  color="#C400A5"
                  stroke
                  @click="goToPaymentDetail(item)"
                )
  
  v-dialog(:value="showPopupInfo" width="363" persistent rounded )
    .customer-dashboard__content-modal
      span.customer-dashboard__text-header-modal Welcome To DeBio Network

      v-img(
        alt="today"
        src="@/assets/doctor_dashboard_modal.svg"
        max-width="128px"
        max-height="128px"
      )

      span.customer-dashboard__text-content-modal It is required to have DBIO tokens as a gas fee to utilize this platform. Kindly ensure that you have an adequate balance before initiating any transactions.
      
      v-btn(
        depressed
        color="secondary"
        large
        width="100%"
        @click="showPopupInfo = false") Let’s get started
</template>

<script>
import {
  creditCardIcon,
  layersIcon,
  labIllustration,
  bookGradient,
  cardGradient,
  partialBookGradient,
  doctorDashboardIllustrator,
  eyeIcon
} from "@debionetwork/ui-icons";
import { queryDnaSamples } from "@debionetwork/polkadot-provider";
import { mapState } from "vuex";
import {
  ORDER_STATUS_DETAIL,
  PAYMENT_STATUS_DETAIL
} from "@/common/constants/status";
import { getOrderList } from "@/common/lib/api";
import { fmtReferenceFromHex } from "@/common/lib/string-format";

export default {
  name: "CustomerHome",

  data: () => ({
    creditCardIcon,
    layersIcon,
    labIllustration,
    doctorDashboardIllustrator,
    bookGradient,
    cardGradient,
    partialBookGradient,
    eyeIcon,
    cardBlock: false,
    orderList: [],
    testList: [],
    paymentHistory: [],
    tabs: 0,
    headers: [
      { text: "Order ID", value: "formated_id", sortable: true },
      { text: "Service Name", value: "service_info.name", sortable: true },
      { text: "Service Provider", value: "provider", sortable: true },
      { text: "Date", value: "created_at", sortable: true },
      { text: "Status", value: "status", sortable: true },
      {
        text: "Actions",
        value: "actions",
        sortable: false,
        align: "center",
        width: "5%"
      }
    ],
    banners: [
      {
        icon: bookGradient,
        text: "Request Genetic Analysis",
        link: "customer-request-analysis"
      },
      {
        icon: cardGradient,
        text: "Request Genetic Test",
        link: "customer-request-test"
      },
      {
        icon: partialBookGradient,
        text: "Upload Health Record",
        link: "customer-phr-create"
      }
    ],
    isLoadingPayments: false,
    isLoadingTest: false,
    showPopupInfo: false
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api
    })
  },

  mounted() {
    window.addEventListener("resize", () => {
      if (window.innerWidth <= 959) this.cardBlock = true;
      else this.cardBlock = false;
    });
  },

  async created() {
    if (this.$route.query.currentTab === "recent order") this.tabs = 0;
    if (this.$route.query.currentTab === "recent payments") this.tabs = 1;
    this.showPopupInfo = this.$route.params.openInfo === "open";
    await this.fetchOrders();
    await this.fetchRecentTest();
    await this.getDataPaymentHistory();
  },

  methods: {
    formatDate(date) {
      const formattedDate = new Date(
        parseInt(date.replace(/,/g, ""))
      ).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      return formattedDate;
    },

    setServiceImage(image) {
      return image ? image : require("@/assets/debio-logo.png");
    },

    setTestStatus(status) {
      if (status === "Rejected") {
        const detail = ORDER_STATUS_DETAIL[status.toUpperCase()];
        return detail().name;
      }
      return ORDER_STATUS_DETAIL[status.toUpperCase()].name;
    },

    setStatusColor(status) {
      if (status === "Rejected") {
        const detail = ORDER_STATUS_DETAIL[status.toUpperCase()];
        return detail().color;
      }
      return ORDER_STATUS_DETAIL[status.toUpperCase()].color;
    },

    setPaymentStatusColor(status) {
      return PAYMENT_STATUS_DETAIL[status.toUpperCase()];
    },

    async fetchOrders() {
      this.orderList = await getOrderList();
    },

    async fetchRecentTest() {
      this.testList = [];
      this.isLoadingTest = true;

      const filteredData = this.orderList.orders.data.filter((recentTest) => {
        return (
          recentTest._source.status !== "Unpaid" &&
          recentTest._source.status !== "Cancelled"
        );
      });

      try {
        for (const result of filteredData) {
          const { status } = await queryDnaSamples(
            this.api,
            result._source.dna_sample_tracking_id
          );
          const dataDetail = {
            ...result._source,
            id: result._id,
            formated_id: fmtReferenceFromHex(result._id),
            provider: result._source?.lab_info?.name ?? "Unknown Lab Provider",
            timestamp: parseInt(result._source.created_at.replaceAll(",", "")),
            created_at: new Date(
              parseInt(result._source.created_at.replaceAll(",", ""))
            ).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }),
            status
          };

          this.testList.push(dataDetail);
        }

        this.testList.sort(
          (a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)
        );

        this.isLoadingTest = false;
      } catch (error) {
        console.error(error);
        this.isLoadingTest = false;
      }
    },

    async getDataPaymentHistory() {
      this.paymentHistory = [];

      try {
        this.isLoadingPayments = true;
        const { orders, ordersGA } = this.orderList;
        const results = [...orders.data, ...ordersGA.data];
        for (const result of results) {
          const analystName = `
            ${result._source?.genetic_analyst_info?.first_name ?? ""}
            ${result?._source?.genetic_analyst_info?.last_name ?? ""}
          `;

          const computeAnalystName = !/^\s*$/.test(analystName)
            ? analystName
            : "Unknown Analyst Provider";

          const dataDetail = {
            ...result._source,
            type: result._index,
            id: result._id,
            formated_id: fmtReferenceFromHex(result._id),
            provider:
              result._index === "orders"
                ? result._source?.lab_info?.name ?? "Unknown Lab Provider"
                : computeAnalystName,
            timestamp: parseInt(result._source.created_at.replaceAll(",", "")),
            created_at: new Date(
              parseInt(result._source.created_at.replaceAll(",", ""))
            ).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }),
            provider_service_image:
              result._index === "genetic-analysis-order"
                ? result._source.genetic_analyst_info.profile_image
                : result._source.service_info.image,
            tracking_id:
              result._index === "genetic-analysis-order"
                ? result._source.genetic_analysis_tracking_id
                : result._source.dna_sample_tracking_id
          };

          this.paymentHistory.push(dataDetail);
        }

        this.paymentHistory.sort((a, b) => {
          if (b.status === "Unpaid") return;
          else return parseInt(b.timestamp) - parseInt(a.timestamp);
        });

        this.isLoadingPayments = false;
      } catch (error) {
        console.error(error);
        this.isLoadingPayments = false;
      }
    },

    goToOrderDetail({ id }) {
      this.$router.push({ name: "order-history-detail", params: { id } }); //go to order history detail page
    },

    goToPaymentDetail({ id }) {
      this.$router.push({ name: "customer-payment-details", params: { id } }); //go to payment detail
    }
  }
};
</script>

<style lang="sass" scoped>
@import "@/common/styles/mixins.sass"
@import "@/common/styles/function.sass"

::v-deep
  .v-tabs-slider-wrapper
    height: 5px !important

  .v-tab
    align-items: unset

  .degenics-data-table
    margin-top: 0

.banner-card
  display: flex

  &__container
    width: toRem(220px)
    height: toRem(100px)
    border-radius: toRem(4px)
    backdrop-filter: blur(20px)
    -webkit-backdrop-filter: blur(20px)
    background: rgba(255, 255, 255, .9)
    position: relative
    z-index: 2
    display: inherit
    text-decoration: none
    align-items: center
    justify-content: center
    overflow: hidden
    transition: 250ms ease-in-out

    &:hover
      border: solid 1.9px transparent
      text-shadow: -3px 4px 5px rgba(0, 0, 0, .1)
      box-shadow: 0 1px 2px rgba(252, 146, 233, .4), 0 2px 4px rgba(252, 146, 233, .4), 0 4px 8px rgba(252, 146, 233, .4), 0 8px 16px rgba(252, 146, 233, .4) inset

    &:not(:last-of-type)
      margin-right: toRem(20px)

  &__icon
    margin-right: toRem(24px)

    &::v-deep
      svg
        transition: 250ms ease-in-out
        filter: drop-shadow(rgba(252, 146, 233, .045) -1px 1px) drop-shadow(rgba(252, 146, 233, .045) -2px 2px) drop-shadow(rgba(252, 146, 233, .045) -3px 3px) drop-shadow(rgba(252, 146, 233, .045) -3px 3px) drop-shadow(rgba(252, 146, 233, .045) -4px 4px) drop-shadow(rgba(252, 146, 233, .045) -5px 5px) drop-shadow(rgba(252, 146, 233, .045) -6px 6px) drop-shadow(rgba(252, 146, 233, .045) -7px 7px) drop-shadow(rgba(252, 146, 233, .045) -8px 8px) drop-shadow(rgba(252, 146, 233, .045) -9px 9px) drop-shadow(rgba(252, 146, 233, .045) -10px 10px) drop-shadow(rgba(252, 146, 233, .045) -11px 11px) drop-shadow(rgba(252, 146, 233, .045) -12px 12px) drop-shadow(rgba(252, 146, 233, .045) -13px 13px) drop-shadow(rgba(252, 146, 233, .045) -14px 14px) drop-shadow(rgba(252, 146, 233, .045) -15px 15px) drop-shadow(rgba(252, 146, 233, .045) -16px 16px) drop-shadow(rgba(252, 146, 233, .045) -17px 17px) drop-shadow(rgba(252, 146, 233, .045) -18px 18px) drop-shadow(rgba(252, 146, 233, .045) -19px 19px) drop-shadow(rgba(252, 146, 233, .045) -20px 20px) drop-shadow(rgba(252, 146, 233, .045) -21px 21px) drop-shadow(rgba(252, 146, 233, .045) -22px 22px) drop-shadow(rgba(252, 146, 233, .045) -23px 23px)

  &__text
    color: #595959
    max-width: toRem(115px)
    @include button-2

.tables
  &__tabs
    margin-top: toRem(30px)
    background: #fff
    border-radius: toRem(4px)
    padding: toRem(30px)

.customer-dashboard
  &::v-deep
    .banner__subtitle
      max-width: toRem(322px)
      margin-top: toRem(24px)
      @include body-text-medium-1

    .banner__content
      align-items: center

    .body
      margin-top: 25px
      display: flex
      width: 100%
      flex-wrap: wrap
      gap: 20px

    .content
      margin: 0 5px 5px -5px

    .bodyHeader
      margin-left: 15px

    .leftTable
      width: 545
      flex: 1

    .rightTable
      width: 545
      flex: 1

    .topHead
      font-size: 15px

    .botomHead
      font-size: 10px

    .btnHead
      font-size: 10px
      margin-left: 25px
      margin-top: -15px

    .iconTable
      margin-left: 8px
      margin-top: -2px

    .status
      color: #48A868 !important

    .textBox
      margin-top: 14px

    .subTextBox
      margin-top: -40px

    .serviceImage
      margin: 0 10px 0 0
      border-radius: 5px

  &__order
    @include tiny-reg

  &__order-service-sample-id
    color: #757274

  &__content-modal
    display: flex
    flex-direction: column
    background-color: #FFFFFF
    align-items: center
    padding: 32px 24px
    gap: 16px

  &__text-header-modal
    font-size: 20px
    font-weight: 600
    line-height: 36px
    letter-spacing: 0em
    text-align: center

  &__text-content-modal
    font-size: 14px
    font-weight: 400
    line-height: 21px
    letter-spacing: 0.0075em
    color: #000000
    font-style: normal

.degenics-datatable
  margin: 20px 0 0 0
.degenics-datatable-card
  padding: 0px
</style>
