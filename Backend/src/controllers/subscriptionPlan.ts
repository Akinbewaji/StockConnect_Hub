import {Request, Response} from "express"

import PaymentPlan from  "../Interface/subscriptionInterface"
import { createPlan, updatePlan, returnAPlan, returnAllAvailablePlan} from "../services/subscription"

const createNuPlan = async(req : Request, res : Response)=> {

    const {planDetail} : {planDetail : PaymentPlan} = req.body

   if(!planDetail) {
    res.status(400).json({
        message : "missing required parameter"
   })
   return
}
    
    try {
        const response = await createPlan(planDetail)
        res.status(200).json(response)
    } catch(error) {
        res.status(500).json({
            message : "error creating plan",
            error : error
        })
    }
   
}

const updateAPlan = async(req : Request, res : Response)=> {

const { planId, planDetail }: {
  planId: number
  planDetail: PaymentPlan
} = req.body

    if(!planId && !planDetail) {
        res.status(500).json({
            message : "missing required parameter"
        })
        return
    }

    try {
        const response = await updatePlan(planId, planDetail)
        res.status(200).json(response)
    }catch(error){
        res.status(500).json({
            message : "error updating plan",
            error : error
        })   
        return
     }

}


const getAPlan =async(req :Request, res :Response)=> {

    try{
        const repsonse = await returnAPlan(Number(req.params.planID))
        res.status(200).json(repsonse)
    }catch(error : any) {
        res.status(500).json({
            message : "an error occured while fetching plan",
            error 
    })

    }
}

const getAllPlan = async(req :Request, res : Response)=> {

    try{
        const response = await returnAllAvailablePlan()
        res.status(200).json(response)
    }catch(error : any) {
        res.status(500).json({
            message : "an error occured while fetching all plans",
            error 
    })
    }
}

export {createNuPlan, updateAPlan, getAPlan, getAllPlan}