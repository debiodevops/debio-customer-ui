import { checkIsLoggedIn } from "@/common/lib/route-guard"

export default [
  {
    path: "/",
    component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Layout"),
    beforeEnter: checkIsLoggedIn,
    name: "customer",
    redirect: { name: "customer-dashboard" },
    children: [
      {
        path: "",
        name: "customer-dashboard",
        meta: { pageHeader: "Home" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home")
      },
      {
        path: "maintenance",
        name: "maintenance",
        meta: { pageHeader: "Maintenance" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/maintenancePageLayout"),
        beforeEnter: (to, from, next) => {
          if (from.path === "") next({ name: "customer-dashboard" })
          else next()
        }
      },
      {
        path: "phr",
        name: "customer-phr",
        meta: { pageHeader: "My PHR" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr")
      },
      {
        path: "phr/upload",
        name: "customer-phr-create",
        meta: { pageHeader: "Upload PHR" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/Create")
      },
      {
        path: "phr/edit/:id?",
        name: "customer-phr-edit",
        meta: { pageHeader: "Edit PHR", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/Edit")
      },
      {
        path: "phr/details/:id?",
        name: "customer-phr-details",
        meta: { pageHeader: "Details PHR", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/Details")
      },
      {
        path: "phr/menstrual-calendar",
        name: "menstrual-calendar",
        meta: { pageHeader: "Menstrual Calendar", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/MenstrualCalendar")
      },
      {
        path: "phr/menstrual-calendar/dashboard",
        name: "menstrual-calendar-detail",
        meta: { pageHeader: "Menstrual Calendar", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/MenstrualCalendar/Detail")
      },
      {
        path: "phr/menstrual-calendar/subscription-setting",
        name: "menstrual-calendar-subscription-setting",
        meta: { pageHeader: "Menstrual Calendar", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/MenstrualCalendar/SubscriptionSetting")
      },
      {
        path: "phr/menstrual-calendar",
        name: "menstrual-calendar-selection",
        meta: { pageHeader: "Menstrual Calendar", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/MenstrualCalendar/SelectMenstrualCalendar")
      },
      {
        path: "phr/menstrual-calendar",
        name: "menstrual-calendar-selection-update",
        meta: { pageHeader: "Menstrual Calendar", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/MenstrualCalendar/SelectMenstrualCalendar"),
        props: { isUpdate: true }
      },
      {
        path: "phr/menstrual-calendar/express-yourself",
        name: "menstrual-calendar-select-emoji",
        meta: { pageHeader: "Menstrual Calendar", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/MenstrualCalendar/SelectEmoji")
      },
      {
        path: "phr/maintenance",
        name: "menstrual-calendar-maintenance",
        meta: { pageHeader: "Menstrual Calendar", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/maintenancePageLayout"),
        beforeEnter: (to, from, next) => {
          if (from.path === "") next({ name: "customer-dashboard" })
          else next()
        }
      },
      {
        path: "phr/second-opinion",
        name: "second-opinion",
        meta: { pageHeader: "Second Opinion", parent: "customer-phr" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/Phr/SecondOpinion")
      },

      {
        path: "my-test/:page?",
        name: "my-test",
        meta: { pageHeader: "My Test" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/MyTest")
      },
      {
        path: "order-history-detail/:id?",
        name: "order-history-detail",
        meta: {
          pageHeader: "Order History Detail",
          parent: "my-test"
        },
        component: () => import( /* webpackChunkName */ "@/views/Dashboard/Customer/Home/MyTest/OrderHistoryDetail")
      },
      {
        path: "test-result/:id",
        name: "test-result",
        meta: { pageHeader: "Test Result", parent: "my-test" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/MyTest/TestResult")
      },
      {
        path: "request-test",
        name: "customer-request-test",
        meta: { pageHeader: "Request Test" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/RequestTest")
      },
      {
        path: "request-test/service/:flag?",
        name: "customer-request-test-service",
        meta: { pageHeader: "Select Services", parent: "customer-request-test" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/RequestTest/SelectServicePage")
      },
      {
        path: "request-test/checkout/:id?",
        name: "customer-request-test-checkout",
        meta: { pageHeader: "Checkout", parent: "customer-request-test" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/RequestTest/Checkout")
      },
      {
        path: "request-test/success/:id?",
        name: "customer-request-test-success",
        meta: { pageHeader: "Summary/Instruction", parent: "customer-request-test" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/RequestTest/Success")
      },
      {
        path: "request-test/canceled/:hash?",
        name: "customer-request-test-canceled",
        meta: { pageHeader: "Canceled", parent: "customer-request-test" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/RequestTest/Canceled")
      },

      // Data Bounty
      {
        path: "data-bounty",
        name: "customer-data-bounty",
        meta: { pageHeader: "Data Bounty" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/DataBounty")
      },
      {
        path: "maintenance",
        name: "customer-data-bounty-maintenance",
        meta: { pageHeader: "Data Bounty" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/maintenancePageLayout"),
        beforeEnter: (to, from, next) => {
          if (from.path === "") next({ name: "customer-dashboard" })
          else next()
        }
      },

      {
        path: "payment-history",
        name: "customer-payment-history",
        meta: { pageHeader: "Payment History" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/PaymentHistory")
      },
      {
        path: "payment-details/:id?",
        name: "customer-payment-details",
        meta: { pageHeader: "Details", parent: "customer-payment-history" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/PaymentHistory/Details")
      },

      // My Genetic Data
      {
        path: "genetic-data",
        name: "customer-genetic-data",
        meta: { pageHeader: "My Genetic Data" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData")
      },
      {
        path: "add-genetic-data/:id?",
        name: "customer-add-genetic-data",
        meta: { pageHeader: "My Genetic Data" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData/Add")
      },
      {
        path: "genetic-analysis-detail/:id?",
        name: "customer-genetic-analysis-detail",
        meta: { pageHeader: "Request Genetic Data"},
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData/Details")
      },
      {
        path: "genetic-analysis-detail/:id?/result",
        name: "customer-genetic-analysis-result",
        meta: { parent: "customer-genetic-analysis-detail", pageHeader: "Result"},
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData/Result")
      },
      // Request Analysis
      {
        path: "request-analysis",
        name: "customer-request-analysis",
        meta: { pageHeader: "My Genetic Data" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData/RequestAnalysis")
      },
      {
        path: "request-analysis/select-service",
        name: "customer-request-analysis-service",
        meta: { pageHeader: "My Genetic Data" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData/RequestAnalysis/SelectServiceAnalyst")
      },
      {
        path: "request-analysis/checkout-payment/:id?",
        name: "customer-request-analysis-payment",
        meta: { pageHeader: "My Genetic Data" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData/RequestAnalysis/CheckoutPayment")
      },
      {
        path: "request-analysis/success-payment/:id?",
        name: "customer-request-analysis-success",
        meta: { pageHeader: "My Genetic Data" },
        component: () => import(/* webpackChunkName */ "@/views/Dashboard/Customer/Home/GeneticData/RequestAnalysis/SuccessPage")
      }
    ]
  }
]
