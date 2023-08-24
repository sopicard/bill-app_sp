// Setting up the Jest testing environment to work with DOM functionalities
/**
/**
 * @jest-environment jsdom
 */

import {screen, fireEvent, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { sortBills } from "../containers/BillsUtils.js";
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

// Main testing block for the Bills page
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Mock local storage for user status
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      // Set up DOM
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      // Navigate to Bills page
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      // Wait for the bill icon to load and then check if it's highlighted
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Expect the bill icon to have a certain class or style that indicates it's highlighted
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      const sortedBills = sortBills(bills)
      document.body.innerHTML = BillsUI({ data: sortedBills })

      // Extracting all dates from rendered bills and comparing them with sorted dates
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)

      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on the eye icon", () => {
    test("Then the modal should open and display the image linked to data-bill-url", () => {
        // Creating a simple DOM with an eye icon and an associated modal
        document.body.innerHTML = `
            <div>
                <span data-testid="icon-eye" data-bill-url="https://example.com/bill.jpg"></span>
                <div id="modaleFile" class="modal fade" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-body"></div>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Mocking jQuery's modal function
        $.fn.modal = jest.fn()

        const billsInstance = new Bills({document, localStorage: window.localStorage})
        const eyeIcon = screen.getByTestId("icon-eye")
        
        // Simulating a click on the eye icon
        billsInstance.handleClickIconEye(eyeIcon)

        // Verifying if the image URL in the modal matches the expected URL
        const modalImage = document.querySelector(".modal-body img")

        expect(modalImage.src).toBe("https://example.com/bill.jpg")
    })
})

  describe("When I click on the btn-new-bill button", () => {
    test("Then it should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Mocking the onNavigate function to track if it gets called
      const onNavigateMock = jest.fn()
      new Bills({
        document, 
        onNavigate: onNavigateMock, 
        store: null, 
        localStorage: window.localStorage
      })

      // Simulating a button click and checking if it results in a navigation action
      const newBillButton = screen.getByTestId("btn-new-bill")
      fireEvent.click(newBillButton)

      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
  })

  describe("When I call getBills method", () => {
    test("Then it should return bills correctly formatted", async () => {
      // Mocking the store to return preset bills data
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([...bills])
        })
      }

      const billContainer = new Bills({
        document, 
        onNavigate: null, 
        store: mockStore, 
        localStorage: window.localStorage
      })

      const result = await billContainer.getBills()

      // Checking the date format of the bills
      expect(result[0].date).toMatch(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
      // Checking the status format of the bills
      expect(["pending", "accepted", "refused"]).toContain(result[0].status)
    })

    test("When the bill has a corrupted date, it should log an error and return the bill with unformatted date", async () => {
      const corruptedBill = { ...bills[0], date: "corruptedDate" }
      
      // Mocking the store to return corrupted bill data and spying on console log for error handling
      const store = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([corruptedBill])
        })
      }
      
      const billsInstance = new Bills({ document, onNavigate, store, localStorage: window.localStorage })
      
      const consoleSpy = jest.spyOn(console, "log").mockImplementation()
      
      const result = await billsInstance.getBills()
      
      // Check if the corrupted date remains the same after formatting attempt
      expect(result.some(bill => bill.date === "corruptedDate")).toBe(true)
      // Check if there was an error log
      expect(consoleSpy).toHaveBeenCalled()
    
       // Restore the original console log function
      consoleSpy.mockRestore()
    })   
  })
})
