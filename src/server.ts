import dotenv from 'dotenv';
// import * as google from 'actions-on-google';
import express from 'express';
import morgan from 'morgan';
import * as si from 'systeminformation';
import * as Rx from 'rxjs';
// const si = require('systeminformation');

import { dialogflow, DialogflowConversation} from 'actions-on-google';

class Server {

  private googleApp: any;
  private port: number = 2999;
  private app: express.Application = express();
  private server: any;

  constructor() {
    console.log('Server started');
    this.start();
  }

  start() {
    this.config();
    this.routes();
  }

  public config(): void {
    console.log('Configuring server');
    this.server = this.app.listen(this.port, () => console.log(`Server started on port ${this.port}`));
    this.app.use(express.json());

    this.googleApp = dialogflow({ debug: false });

    morgan.token('statusColor', (_req: any, res: any, _args: any) => {
      // get the status code if response written
      let status;
      if (typeof res.headersSent === 'boolean') {
          status = res.headersSent;
      } if (status === true) {
          status = res.statusCode;
      }
      if (status === undefined) {
          status = 0;
      }

      // get status color
      let color = 0;
      if (status >= 500) {
          color = 31; // red
      } else if (status >= 400) {
          color = 33; // yellow
      } else if (status >= 300) {
          color = 36; // cyan
      } else if (status >= 200) {
          color = 32; // green
      }
      return '\x1b[' + color + 'm' + status + '\x1b[0m';
    });

    this.app.use(morgan(':date[iso] - :method :url - :statusColor - :response-time ms'));
  }

  public routes(): void {
    console.log('Routing server');

    this.googleApp.intent('Default Welcome Intent', (conv: DialogflowConversation) => {
      conv.ask('Welcome to my agent!');
    });

    this.googleApp.intent('Get data', async (conv: DialogflowConversation) => {
      return new Rx.Observable((obs) => {
        let str: string = 'Ohh I see!';
        // conv.ask('Ohh I see');
        const obsArray: Array<Rx.Observable<any>> = [
          Rx.of(si.cpuTemperature()),
          Rx.of(si.cpu()),
        ];

        Rx.forkJoin(obsArray).subscribe({
          next: (data) => {
            console.log(data[0]);
            console.log(data[1]);
            str = `CPU temperature: ${data[0].main}`;
            str += `\nCPU max: ${data[1].speedMax}`;
            // conv.ask(str);
            obs.next(str);
            obs.complete();
          },
          error: (err) => {
            console.log(err);
            obs.error(err);
          },
        });

        // Rx.of(si.cpuTemperature()).subscribe({
        //   next: ((data: any) => {
        //     console.log(data);
        //     str += '\nCPU temperature is ' + data.main;
        //     // conv.ask(str);
        //     obs.next(str);
        //     obs.complete();
        //   }),
        // });
      }).subscribe({
        next: (data: string) => {
          console.log(data);
          conv.ask(data);
        }
      })
    });

    this.googleApp.intent('Goodbye', (conv: DialogflowConversation) => {
      conv.close('See you later!')
    });

    this.googleApp.intent('Default Fallback Intent', (conv: DialogflowConversation) => {
      conv.ask('I didn\'t understand');
    });

    const router: express.Router = express.Router();
    router.post('/fulfillment', this.googleApp);
    router.get('/test', (req, res) => {
      const obsArray: Array<Rx.Observable<any>> = [
        Rx.of(si.cpuTemperature()),
        Rx.of(si.cpu()),
        Rx.of(si.mem()),
      ];

      Rx.forkJoin(obsArray).subscribe({
        next: (data) => {
          res.status(200).send({
            data,
          });
        },
        error: (err) => {
          console.log(err);
        },
      });
    });
    this.app.use('/', router);
  }

  public shutdown(): void {
    this.server.close();
    console.log('Shutting down server');
  }
}

const server = new Server();

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  server.shutdown();
});

process.on('SIGINT', () => {
  console.info('SIGINT signal received.');
  server.shutdown();
});
