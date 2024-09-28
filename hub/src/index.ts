
import portfinder from 'portfinder'
import { program, InvalidArgumentError } from 'commander'
import { startHub } from './server'

// parseInt does not work directly in commander
function commanderParseInt(value: string) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

// parse command line arguments
program
  .version(process.env.npm_package_version || '', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-n, --name <value>', 'Name of Hub on the network', 'Nestor Hub')
  .option('-p, --port <value>', 'Port number', commanderParseInt, 3000)
  .parse(process.argv);
const options = program.opts();

// now start it
portfinder.getPort({ port: options.port }, (err, port) => {

  if (err) {
    console.error('Error while finding port', err)
    process.exit(1)
  }
  
  startHub(options.name, port)

})
