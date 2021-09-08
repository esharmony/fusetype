To install either: 

- npm i fusetype
- yarn add fusetype 

### What is FuseType?

FuseType is a simple yet powerful state management system, that at its core is the observer / pub sub pattern.  
Its function is to help you share state with seperate components across your application.

### Why should I use FuseType?

FuseType is super lightweight and extremly easy to configure.  
There's no nesting of components or funky obfuscated elements in its setup.

At its heart, it is the tried and tested observer pattern, with a few methods thrown in to help make using it super simple.

### What is a FuseType?
This is a fuseType.

    import { CreateFuseType } from "fusetype";
    
    export interface CounterState {
      count:number;
    }
    
    export interface CounterFuseType {
      state:CounterState;
      increment:() => void;
      decrement:() => void;
    }
    
    const Counter: CounterFuseType = {
      state: {
        count:0,
      },
      increment: () => Counter.state.count++,
      decrement: () => Counter.state.count--,
    }
    
    export default CreateFuseType<CounterFuseType, CounterState>(Counter);
     

A FuseType is a simple fusion of the state required, and the methods that will mutate that state.

It is made up of three parts:

*   The interface for the state
*   The interface for the FuseType
*   The implemetation of the FuseType (state and methods)

The state should be implemented as your default state, and the methods as the operations  
on the state you wish to perform.

### Methods

All methods are to be of type void. This is because the result of your mutation will be passed to all components that are registered for them - (example futher down)

You can pass any parameters to your methods:

    increment: (amount: number) => Counter.state.count = amount;


Methods can be asynchronous:

    addStarWarsFilmsToWatch: async () =>  {
        try {
          const response = await fetch('https://swapi.dev/api/films');
          const films = await response.json();
          const items: ListItem[] = [];
          films.results.forEach((film:any) => {
              items.push(transformFilmToListItem(film))
          });
          todoList.setItems(items);
        }
        catch(err){
          todoList.error();
          todoList.setErrorMessage(err.message);
        }
        finally {
          todoList.setIsLoading(false);
        }
    
        // taken from the Todo list example (coming soon)
    }

To use the methods in any view, you just need to import your FuseType and execute the method as so where required.

Below is a React example:

     import Counter from '../FuseTypes/Counter';
    
      const CounterButtons = () => {
        return <>
        <div id="btn">
        <button onClick={() => Counter.increment()}>Increment<button>
        <button onClick={() => Counter.decrement()}>Decrement</button>
        <button onClick={() => Counter.clearState()}>Reset</button>
        </div>
        </>
      }
    
      export default CounterButtons

Be aware, at this point you have to execute your methods in a certain way:


    // not possible
    
    <button onClick={Counter.increment}>Increment<button>
    
    // must be like this
    
    <button onClick={() => Counter.decrement()}>Decrement</button>

### Additional Methods

Each FuseType comes with these additional library methods:

*   **register**: register a function for state updates
*   **remove:** remove the registered function for state updates
*   **getLatestState:** requests the current state (passed to the registered function, not returned)
*   **clearState:** resets the state to the default setting

More information on these methods is provided in the section on state coming up.

### Private Methods

All methods on your FuseType will be available on the imported object, but you can also write private functions in your FuseType file that can transform your data etc that will not be exposed.

Below is an example of this technique.

     const stopDecrementAtZero = (count: number) => {
        if(count === 0) return;
        else Counter.state.count--;
      }
    
      const Counter: CounterFuseType = {
        state: {
          count:0,
        },
        increment: () => Counter.state.count++,
        decrement: () => stopDecrementAtZero(Counter.state.count),
      }

The stopDecrementAtZero function will not be found on the exported FuseType. Only those methods that are part of the actual FuseType itself will be exposed.

### State

To access the updates to your FuseType state, you import your FuseType, then register a function with your view once your view is mounted.  

Below is a react example.

 

      import { useEffect, useState } from "react";
      import Counter, { CounterState } from '../FuseTypes/Counter';
    
      const ViewCounter = () => {
    
        // ATTENTION: notice the Counter.state property, this is your default state
    
        const [counter, setCounter] = useState<CounterState>(Counter.state);
    
        const updateCounter = (state:CounterState) => {
            setCounter(state);
        } 
    
        useEffect(() => {
          Counter.register(updateCounter, ViewCounter.name);
        },[]);
    
        return <h1>{counter.count}</h1>
      }
    
      export default ViewCounter

**The register method**



    useEffect(() => {
    	Counter.register(updateCounter, ViewCounter.name);
    },[]);

 

The register method takes two parameters:

*   The function which you are registering to receive your state updates
*   A unique string that will be used in removal of the function at runtime - As you will only need to register once per component / view I generally use the name of the component registering, but you can use any unique string.

**The update function**

     const updateCounter = (state:CounterState) => {
        setCounter(state);
      } 

The registered function can be named anyway you prefer (here being updateCounter) but it must contain the state parameter with the type of your state.  
Now when any state change occurs this function (and any other functions registered for this FuseType in any other views) will be executed.

In the react example you see I then take that update and pass it to a standand useState React hook which then updates the component.

**Optional previous state**

	 const updateCounter = (state:CounterState, prevState:CounterState) => {
        console.log(prevState.count); // 0
        console.log(state.count); // 1
        setCounter(state);
     } 

You can get access to the previous state by adding the prevState parameter with the type of your state.  
You can then use this information to decide whether or not to update / rerender your component.

**The remove method**

	useEffect(() => {
	    Counter.register(updateCounter, ViewCounter.name);
	    return () => Counter.remove(ViewCounter.name);
    },[]);

On calling the remove function passing the unique string you registered with, your update function will no longer receive updates. This can be useful if wish to stop rendering your view for any reason, such as the user has hidden it from view.

If it has been removed, you can then execute the register method again to re-register. This can be done as many times as you wish.

**The getLatestState Method**

    Counter.getLatestState();

If you are re-registering, you may find you need to call the getLatestState method to insure your view is up to date with all the latest changes.

The value will not be returned, the method will trigger a call to your update function.

### Testing

    
    
	  import { act } from 'react-dom/test-utils';
      import Counter from '../Counter';
    
      describe('Counter tests', () => {
        beforeEach(() => {
          // clear state is a method that comes on all FuseTypes
          act(() => Counter.clearState())
        })
        describe('When incrementing the counter twice', () => {
          it('should have set the state count to 2', () => {
            act(() => Counter.increment());
            act(() => Counter.increment());
            expect(Counter.state.count).toEqual(2);
          });
        });
        describe('When decrementing the counter once after two increments', () => {
          it('should have set the state count to 1', () => {
            act(() => Counter.increment());
            act(() => Counter.increment());
            act(() => Counter.decrement());
            expect(Counter.state.count).toEqual(1);
          });
        });
      });

Testing is extremly simple, just three things to note.

*   Before each test we want to reset the state to default to give a clean start
*   We just execute our methods, I used act but I do not think that is a requirement
*   Each FuseType has a state property, this is what we check against after the methods have been executed

### Async Testing

coming soon..




