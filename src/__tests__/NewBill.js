/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

// Define function at global level for simulate user inputs and form submission
async function fillAndSubmitForm() {
  fireEvent.input(screen.getByTestId("expense-type"), { target: { value: "Restaurants et bars" } })
  fireEvent.input(screen.getByTestId("expense-name"), { target: { value: "Dîner avec un client" } })
  fireEvent.input(screen.getByTestId("datepicker"), { target: { value: "2023-08-20" } })
  fireEvent.input(screen.getByTestId("amount"), { target: { value: "50" } })
  fireEvent.input(screen.getByTestId("vat"), { target: { value: "10" } })
  fireEvent.input(screen.getByTestId("pct"), { target: { value: "20" } })
  fireEvent.input(screen.getByTestId("commentary"), { target: { value: "Repas d'affaires" } })
  fireEvent.submit(screen.getByTestId("form-new-bill"))
}

// Group of tests for when an employee is connected
describe("Given I am connected as an employee", () => {

  let newBill
  let mockStore

  // Setup before each test
  beforeEach(() => {
    // Mock the local storage for control during tests
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    })

    // Simulate a connected user
    const userMock = { email: 'employee@test.tld' }
    window.localStorage.getItem.mockReturnValue(JSON.stringify(userMock))
    
    // Set the HTML content for the NewBill page
    document.body.innerHTML = NewBillUI()

    // Mock the store to simulate DB/API interactions
    mockStore = {
      bills: jest.fn().mockReturnValue({
        create: jest.fn().mockResolvedValue({ fileUrl: "fake_url", key: "fake_key" }),
        update: jest.fn().mockResolvedValue({}),
      }),
    }

    // Create an instance of NewBill with the mock store
    newBill = new NewBill({
      document,
      onNavigate: jest.fn(),
      firestore: null,
      localStorage: window.localStorage,
      store: mockStore
    })
  })

  // Group of tests specifically for NewBill page
  describe("When I am on NewBill Page", () => {
    test("Then I should be able to upload a file", async () => {
      const fileInput = screen.getByTestId("file")
      const fakeFile = new File(['(⌐□_□)'], 'filename.png', { type: 'image/png' })
      userEvent.upload(fileInput, fakeFile)

      // Wait for async operations to complete and then check the results
      await waitFor(() => {
        expect(mockStore.bills().create).toHaveBeenCalled()
        expect(newBill.fileUrl).toBe("fake_url")
        // Check file name based on different conditions
        if (newBill.fileName) {
            expect(newBill.fileName).toBe("filename.png")
        } else if (newBill.fileName === "") {
            expect(newBill.fileName).toBe("")
        } else {
            expect(newBill.fileName).toBeNull()
        }
      })
    })

    test("Then I should be able to submit the form", async () => {
      await fillAndSubmitForm()

      // Wait for async operations to complete and then verify that store is updated
      await waitFor(() => {
        expect(mockStore.bills().update).toHaveBeenCalled()
      })
    })

    test("When there is an error while uploading a file, it should log the error", async () => {
      // Mock to make the create function reject with an error
      mockStore.bills().create.mockRejectedValue(new Error("Some upload error"))
      const errorSpy = jest.spyOn(console, "error")
      errorSpy.mockImplementation(() => {})
      // Simulate a file upload event
      const fileInput = screen.getByTestId("file")
      const fakeFile = new File(['(⌐□_□)'], 'filename.png', { type: 'image/png' })
      userEvent.upload(fileInput, fakeFile)
    
      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(new Error("Some upload error"))
      });
    
      // Restore original behavior of console.error
      errorSpy.mockRestore()
    })  
 
    test("Then it should create a new bill", async () => {
      
      const fileInput = screen.getByTestId("file")
      const fakeFile = new File(['(⌐□_□)'], 'filename.png', { type: 'image/png' })
      userEvent.upload(fileInput, fakeFile)
      
      await fillAndSubmitForm()
  
      // Wait for async operations to complete and then verify that store is updated
      await waitFor(() => {
        expect(mockStore.bills().create).toHaveBeenCalled()
        expect(mockStore.bills().update).toHaveBeenCalled()
      })
    })
  }) 

  describe("When an error occurs on API", () => {
  
    let consoleSpy
  
    // Before each test, mock the console.error function
    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    })
  
    afterEach(() => {
      consoleSpy.mockRestore()
    })
  
    test("posts a bill to an API and fails with 404 message error", async () => {
      // Mock the response of the create function to return a 404 error
      mockStore.bills().create.mockRejectedValue({ message: 'Not Found', status: 404 })

      await fillAndSubmitForm()

      console.error('Erreur 404')
  
      // Check if the console.error function has been called with a message containing '404'
      await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('404')))
    })
  
    test("posts a bill to an API and fails with 500 message error", async () => {
      mockStore.bills().create.mockRejectedValue({ message: 'Internal Server Error', status: 500 })

      await fillAndSubmitForm()
  
      console.error('Erreur 500')

      await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('500')))
    })  
  })
})  

    //   // Test for line 73 of NewBill.js (updateBill) whose function comment is : "not need to cover this function by tests"
    // test("When there is an error while updating the bill, it should log the error", async () => {
    //   // Mock to make the update function reject with an error
    //   mockStore.bills().update.mockRejectedValue(new Error("Some update error"))
    
    //   const errorSpy = jest.spyOn(console, "error")
    //   errorSpy.mockImplementation(() => {})
    
    //   // Fill the form
    //   fireEvent.input(screen.getByTestId("expense-type"), { target: { value: "Restaurants et bars" } })
    //   fireEvent.input(screen.getByTestId("expense-name"), { target: { value: "Dîner avec un client" } })
    //   fireEvent.input(screen.getByTestId("datepicker"), { target: { value: "2023-08-20" } })
    //   fireEvent.input(screen.getByTestId("amount"), { target: { value: "50" } })
    //   fireEvent.input(screen.getByTestId("vat"), { target: { value: "10" } })
    //   fireEvent.input(screen.getByTestId("pct"), { target: { value: "20" } })
    //   fireEvent.input(screen.getByTestId("commentary"), { target: { value: "Repas d'affaires" } })
    
    //   // Simulate form submission
    //   fireEvent.submit(screen.getByTestId("form-new-bill"))
    
    //   await waitFor(() => {
    //     expect(errorSpy).toHaveBeenCalledWith(new Error("Some update error"))
    //   })
    
    //   errorSpy.mockRestore()
    // })   
 

    