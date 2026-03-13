 import axios from 'axios';
const paystackUrl = 'https://api.paystack.co';
import PaymentPlan from '../Interface/subscriptionInterface';

 const createPlan = async(planDetails : PaymentPlan)=> {

    try {
        const response = await axios.post(`${paystackUrl}/plan`, {
            name: planDetails.planName,
            interval: planDetails.interval,
            amount: planDetails.amount * 100, 
            description: planDetails.description,
            send_sms: planDetails.sendSms,
            send_invoices: planDetails.sendInvoice
        },{
            headers : {
                Authorization : `Bearer ${process.env.PAYSTACK_PRIVATE_KEY}`
            }
        })

        return response.data
    }
    catch(error : any) {
        console.log(error)
        console.error("Error creating plan:", error.response ? error.response.data : error.message);
        throw new Error("Failed to create plan");
    }

 }

 const updatePlan = async(planId : number, planDetails :PaymentPlan)=> {

    try{
        const response = await axios.put(`${paystackUrl}/plan/${planId}`, {
            name: planDetails.planName,
            interval: planDetails.interval,
            amount: planDetails.amount * 100, 
            description: planDetails.description,
            send_sms: planDetails.sendSms,
            send_invoices: planDetails.sendInvoice
        },{
            headers : {
                Authorization : `Bearer ${process.env.PAYSTACK_PRIVATE_KEY}`
            }
         })

         return response.data
    }
    catch(error : any) {
        console.error("Error updating plan:", error.response ? error.response.data : error.message);
        throw new Error("Failed to update plan");
    }
 }

 const returnAPlan = async(planID : number)=> {

    try {
        const response = await axios.get(`${paystackUrl}/plan/${planID}`, {
            headers : {
                Authorization : `Bearer ${process.env.PAYSTACK_PRIVATE_KEY}`
            }
        })
        return response.data
    }
    catch(error : any) {
        console.error("Error fetching plan:", error.response ? error.response.data : error.message);
        throw new Error("Failed to fetch plan");
    }
 }

 const returnAllAvailablePlan = async()=> {
    try {

        const response = await axios.get(`${paystackUrl}/plan`, {
           headers : {
                Authorization : `Bearer ${process.env.PAYSTACK_PRIVATE_KEY}`
            }
        })
        return response.data
    }catch(error : any) {
        console.error("Error fetching plans:", error.response ? error.response.data : error.message);
        throw new Error("Failed to fetch plans");
    }
 }

 export { createPlan, updatePlan, returnAPlan, returnAllAvailablePlan }